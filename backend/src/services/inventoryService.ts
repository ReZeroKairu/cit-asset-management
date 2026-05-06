import { prisma } from "../config/database";

export const getInventory = async (
  userRole: string | undefined,
  userLabId: number | null | undefined,
  filters: { lab_id?: number; workstation_id?: number },
) => {
  let whereConditions: string[] = [];
  const params: any[] = [];

  // Role-based access control
  if (userRole === "Custodian") {
    if (userLabId) {
      const requestedLabId = filters.lab_id
        ? Number(filters.lab_id)
        : userLabId;
      if (filters.lab_id && Number(filters.lab_id) !== userLabId) {
        throw new Error(
          "FORBIDDEN: You can only view assets from your assigned laboratory",
        );
      }
      whereConditions.push("lab_id = ?");
      params.push(requestedLabId);
    } else {
      return []; // Unassigned custodians see nothing
    }
  } else if (filters.lab_id) {
    whereConditions.push("lab_id = ?");
    params.push(Number(filters.lab_id));
  }

  if (filters.workstation_id) {
    whereConditions.push("workstation_id = ?");
    params.push(Number(filters.workstation_id));
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  try {
    // Try optimized view first
    const assets = await prisma.$queryRawUnsafe(
      `
      SELECT 
        asset_id, lab_id, workstation_id, unit_id, date_added, added_by_user_id,
        property_tag_no, quantity, description, serial_number, date_of_purchase,
        date_disposed, disposed_by, asset_remarks, status_id, asset_status,
        lab_name, lab_location, unit_name, device_type_name, added_by_name
      FROM view_asset_full_details
      ${whereClause}
      ORDER BY date_added DESC
    `,
      ...params,
    );

    // Transform view result
    return (assets as any[]).map((asset) => ({
      asset_id: Number(asset.asset_id),
      lab_id: Number(asset.lab_id),
      workstation_id: Number(asset.workstation_id),
      unit_id: Number(asset.unit_id),
      date_added: asset.date_added,
      added_by_user_id: Number(asset.added_by_user_id),
      asset_details: {
        property_tag_no: asset.property_tag_no,
        quantity: Number(asset.quantity || 0),
        description: asset.description,
        serial_number: asset.serial_number,
        date_of_purchase: asset.date_of_purchase,
        date_disposed: asset.date_disposed,
        disposed_by: asset.disposed_by,
        asset_remarks: asset.asset_remarks,
        status_id: Number(asset.status_id),
        asset_statuses: { status_name: asset.asset_status },
      },
      laboratories: asset.lab_name
        ? { lab_name: asset.lab_name, location: asset.lab_location }
        : null,
      units: asset.unit_name ? { unit_name: asset.unit_name } : null,
      users: asset.added_by_name ? { full_name: asset.added_by_name } : null,
      workstations: null,
    }));
  } catch (viewError) {
    // Fallback to standard Prisma query
    const prismaWhere: any = {};
    if (userRole === "Custodian" && userLabId) {
      const requestedLabId = filters.lab_id
        ? Number(filters.lab_id)
        : userLabId;
      if (!filters.lab_id || Number(filters.lab_id) === userLabId) {
        prismaWhere.lab_id = requestedLabId;
      }
    } else if (filters.lab_id) {
      prismaWhere.lab_id = Number(filters.lab_id);
    }

    if (filters.workstation_id) {
      prismaWhere.workstation_id = Number(filters.workstation_id);
    }

    return prisma.inventory_assets.findMany({
      where: Object.keys(prismaWhere).length > 0 ? prismaWhere : undefined,
      include: {
        asset_details: { include: { asset_statuses: true } },
        laboratories: true,
        units: true,
        users: true,
        workstations: true,
      },
      orderBy: { date_added: "desc" },
    });
  }
};

export const createAsset = async (data: any, userId?: number) => {
  return prisma.inventory_assets.create({
    data: {
      lab_id: data.lab_id ? Number(data.lab_id) : null,
      unit_id: data.unit_id ? Number(data.unit_id) : null,
      workstation_id: data.workstation_id ? Number(data.workstation_id) : null,
      added_by_user_id: userId ? Number(userId) : null,
      asset_details: {
        create: {
          description: data.description,
          property_tag_no: data.property_tag_no,
          serial_number: data.serial_number,
          quantity: Number(data.quantity) || 1,
          date_of_purchase: data.date_of_purchase
            ? new Date(data.date_of_purchase)
            : null,
          asset_remarks: data.asset_remarks || null,
          status_id: data.status_id ? Number(data.status_id) : 1,
        },
      },
    },
    include: {
      asset_details: true,
      laboratories: true,
      units: true,
      users: true,
      workstations: true,
    },
  });
};

export const batchCreateAssets = async (assets: any[], userId?: number) => {
  if (!Array.isArray(assets) || assets.length === 0) {
    throw new Error("Assets array is required");
  }

  // 1. Initial Structural Validation
  const validationErrors = [];
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    if (!asset.lab_id)
      validationErrors.push(`Asset ${i + 1}: Lab ID is required`);
    if (!asset.unit_id)
      validationErrors.push(`Asset ${i + 1}: Unit ID is required`);
  }
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
  }

  // 2. Validate Labs Exist
  const labIds = [...new Set(assets.map((a) => a.lab_id))];
  const existingLabs = await prisma.laboratories.findMany({
    where: { lab_id: { in: labIds } },
    select: { lab_id: true },
  });
  const missingLabs = labIds.filter(
    (id) => !existingLabs.find((lab: any) => lab.lab_id === id),
  );
  if (missingLabs.length > 0)
    throw new Error(`Invalid lab IDs: ${missingLabs.join(", ")}`);

  // 3. Validate Units Exist
  const unitIds = [...new Set(assets.map((a) => a.unit_id))];
  const existingUnits = await prisma.units.findMany({
    where: { unit_id: { in: unitIds } },
    select: { unit_id: true },
  });
  const missingUnits = unitIds.filter(
    (id) => !existingUnits.find((unit: any) => unit.unit_id === id),
  );
  if (missingUnits.length > 0)
    throw new Error(`Invalid unit IDs: ${missingUnits.join(", ")}`);

  // 4. Validate Workstations Exist (If provided)
  const workstationIds = assets
    .filter((a) => a.workstation_id)
    .map((a) => a.workstation_id!);
  if (workstationIds.length > 0) {
    const existingWorkstations = await prisma.workstations.findMany({
      where: { workstation_id: { in: workstationIds } },
      select: { workstation_id: true },
    });
    const missingWorkstations = workstationIds.filter(
      (id) => !existingWorkstations.find((ws: any) => ws.workstation_id === id),
    );
    if (missingWorkstations.length > 0)
      throw new Error(
        `Invalid workstation IDs: ${missingWorkstations.join(", ")}`,
      );
  }

  // 5. Execute Transaction
  return prisma.$transaction(async (tx: any) => {
    const results = [];
    for (const asset of assets) {
      const newAsset = await tx.inventory_assets.create({
        data: {
          lab_id: Number(asset.lab_id),
          unit_id: Number(asset.unit_id),
          workstation_id: asset.workstation_id
            ? Number(asset.workstation_id)
            : null,
          added_by_user_id: userId ? Number(userId) : null,
          asset_details: {
            create: {
              property_tag_no: asset.property_tag_no || null,
              description: asset.description?.trim() || "",
              serial_number: asset.serial_number?.trim() || "",
              quantity: Number(asset.quantity) || 1,
              date_of_purchase: asset.date_of_purchase
                ? new Date(asset.date_of_purchase)
                : null,
              asset_remarks: asset.asset_remarks || null,
              status_id: asset.status_id ? Number(asset.status_id) : 1,
            },
          },
        },
        include: {
          asset_details: true,
          laboratories: true,
          units: true,
          users: true,
          workstations: true,
        },
      });
      results.push(newAsset);
    }
    return results;
  });
};

export const updateAsset = async (assetId: number, updateDataRaw: any) => {
  const updateData: any = {};
  if (updateDataRaw.lab_id !== undefined)
    updateData.lab_id = updateDataRaw.lab_id
      ? Number(updateDataRaw.lab_id)
      : null;
  if (updateDataRaw.unit_id !== undefined)
    updateData.unit_id = updateDataRaw.unit_id
      ? Number(updateDataRaw.unit_id)
      : null;
  if (updateDataRaw.workstation_id !== undefined)
    updateData.workstation_id = updateDataRaw.workstation_id
      ? Number(updateDataRaw.workstation_id)
      : null;

  const detailsData: any = {};
  if (updateDataRaw.description !== undefined)
    detailsData.description = updateDataRaw.description;
  if (updateDataRaw.property_tag_no !== undefined)
    detailsData.property_tag_no = updateDataRaw.property_tag_no;
  if (updateDataRaw.serial_number !== undefined)
    detailsData.serial_number = updateDataRaw.serial_number;
  if (updateDataRaw.quantity !== undefined)
    detailsData.quantity = Number(updateDataRaw.quantity) || 1;
  if (updateDataRaw.date_of_purchase !== undefined)
    detailsData.date_of_purchase = updateDataRaw.date_of_purchase
      ? new Date(updateDataRaw.date_of_purchase)
      : null;
  if (updateDataRaw.asset_remarks !== undefined)
    detailsData.asset_remarks = updateDataRaw.asset_remarks || null;
  if (
    updateDataRaw.status_id !== undefined &&
    updateDataRaw.status_id !== null
  ) {
    detailsData.status_id = Number(updateDataRaw.status_id);
  }
  if (updateDataRaw.disposed_by !== undefined)
    detailsData.disposed_by = updateDataRaw.disposed_by || null;

  const existingAssetDetails = await prisma.asset_details.findUnique({
    where: { asset_id: assetId },
  });
  const { status_id: statusIdField, ...otherDetails } = detailsData;

  // Handle Disposal side-effects
  if (statusIdField !== undefined && statusIdField !== null) {
    const disposedStatus = await prisma.asset_statuses.findUnique({
      where: { status_name: "Disposed" },
    });
    if (disposedStatus && Number(statusIdField) === disposedStatus.status_id) {
      otherDetails.date_disposed = new Date();
    }
  }

  if (!existingAssetDetails && Object.keys(otherDetails).length > 0) {
    return prisma.inventory_assets.update({
      where: { asset_id: assetId },
      data: {
        ...updateData,
        asset_details: {
          create: {
            ...otherDetails,
            ...(statusIdField !== undefined && {
              status_id: Number(statusIdField),
            }),
          },
        },
      },
      include: {
        asset_details: { include: { asset_statuses: true } },
        laboratories: true,
        units: true,
        users: true,
        workstations: true,
      },
    });
  } else {
    return prisma.inventory_assets.update({
      where: { asset_id: assetId },
      data: {
        ...updateData,
        ...(Object.keys(otherDetails).length > 0 || statusIdField !== undefined
          ? {
              asset_details: {
                update: {
                  ...otherDetails,
                  ...(statusIdField !== undefined && {
                    status_id: Number(statusIdField),
                  }),
                },
              },
            }
          : {}),
      },
      include: {
        asset_details: { include: { asset_statuses: true } },
        laboratories: true,
        units: true,
        users: true,
        workstations: true,
      },
    });
  }
};

export const deleteAsset = async (assetId: number) => {
  const existingAsset = await prisma.inventory_assets.findUnique({
    where: { asset_id: assetId },
    include: {
      asset_details: true,
      complaints: true,
      service_log_assets: true,
    },
  });

  if (!existingAsset) throw new Error("NOT_FOUND: Asset not found");

  const relatedRecords = {
    asset_details: existingAsset.asset_details ? 1 : 0,
    complaints: existingAsset.complaints?.length || 0,
    service_log_assets: existingAsset.service_log_assets?.length || 0,
  };

  const hasRelatedRecords = Object.values(relatedRecords).some(
    (count) => count > 0,
  );

  if (hasRelatedRecords) {
    await prisma.$transaction(async (tx) => {
      if (relatedRecords.service_log_assets > 0)
        await tx.service_log_assets.deleteMany({
          where: { asset_id: assetId },
        });
      if (relatedRecords.complaints > 0)
        await tx.complaints.deleteMany({ where: { asset_id: assetId } });
      if (relatedRecords.asset_details > 0)
        await tx.asset_details.delete({ where: { asset_id: assetId } });
    });
  }

  await prisma.inventory_assets.delete({ where: { asset_id: assetId } });
  return { message: "Asset deleted successfully" };
};

export const getAssetStatuses = async () => {
  return prisma.asset_statuses.findMany();
};
