import { prisma } from "../config/database";

export const getAllWorkstations = async (
  userRole?: string,
  userLabId?: number | null,
) => {
  let whereConditions: string[] = [];
  const params: any[] = [];

  // Role-based access control
  if (userRole === "Custodian") {
    if (userLabId) {
      whereConditions.push("lab_id = ?");
      params.push(userLabId);
    } else {
      return []; // Unassigned custodians see nothing
    }
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  try {
    // Try optimized view first
    const workstations = await prisma.$queryRawUnsafe(
      `
      SELECT 
        workstation_id, workstation_name, lab_id, status_id, workstation_remarks,
        created_at, lab_name, lab_location, workstation_status, asset_count,
        last_maintenance_date, last_report_date, service_status_30d
      FROM view_workstation_status_summary
      ${whereClause}
      ORDER BY workstation_name ASC
    `,
      ...params,
    );

    // Transform view result
    return (workstations as any[]).map((ws) => ({
      workstation_id: Number(ws.workstation_id),
      workstation_name: ws.workstation_name,
      lab_id: Number(ws.lab_id),
      status_id: Number(ws.status_id),
      workstation_remarks: ws.workstation_remarks,
      created_at: ws.created_at,
      laboratories: ws.lab_name
        ? {
            lab_id: Number(ws.lab_id),
            lab_name: ws.lab_name,
            location: ws.lab_location,
          }
        : null,
      asset_statuses: ws.workstation_status
        ? { status_name: ws.workstation_status }
        : null,
      inventory_assets: [],
      asset_count: Number(ws.asset_count || 0),
      last_maintenance_date: ws.last_maintenance_date,
      last_report_date: ws.last_report_date,
      service_status_30d: ws.service_status_30d,
    }));
  } catch (viewError) {
    // Fallback to Prisma
    const prismaWhere: any = {};
    if (userRole === "Custodian" && userLabId) prismaWhere.lab_id = userLabId;

    return prisma.workstations.findMany({
      where: Object.keys(prismaWhere).length > 0 ? prismaWhere : undefined,
      include: {
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true },
        },
        asset_statuses: true,
        inventory_assets: { include: { asset_details: true, units: true } },
      },
    });
  }
};

export const createWorkstation = async (data: any) => {
  if (!data.workstation_name)
    throw new Error("VALIDATION: Workstation name is required");

  return prisma.workstations.create({
    data: {
      workstation_name: data.workstation_name,
      lab_id: data.lab_id ? Number(data.lab_id) : null,
      workstation_remarks: data.workstation_remarks || null,
      status_id: data.status_id ? Number(data.status_id) : 1,
    },
    include: { asset_statuses: true },
  });
};

export const getWorkstationDetails = async (identifier: string | number) => {
  const searchParam = String(identifier);
  const isId = !isNaN(Number(searchParam));

  const workstation = await prisma.workstations.findFirst({
    where: isId
      ? { workstation_id: Number(searchParam) }
      : { workstation_name: searchParam },
    include: {
      laboratories: {
        select: { lab_id: true, lab_name: true, location: true },
      },
      asset_statuses: true,
      inventory_assets: { include: { asset_details: true, units: true } },
    },
  });

  if (!workstation) throw new Error("NOT_FOUND: Workstation not found");
  return workstation;
};

export const updateWorkstation = async (workstationId: number, data: any) => {
  const existingWorkstation = await prisma.workstations.findUnique({
    where: { workstation_id: workstationId },
  });
  if (!existingWorkstation) throw new Error("NOT_FOUND: Workstation not found");

  const updateData: any = {
    workstation_name: data.workstation_name,
    workstation_remarks: data.workstation_remarks,
  };
  if (data.status_id) updateData.status_id = Number(data.status_id);
  if (data.lab_id) updateData.lab_id = Number(data.lab_id);

  return prisma.workstations.update({
    where: { workstation_id: workstationId },
    data: updateData,
    include: { asset_statuses: true },
  });
};

export const deleteWorkstation = async (workstationId: number) => {
  const existingWorkstation = await prisma.workstations.findUnique({
    where: { workstation_id: workstationId },
  });
  if (!existingWorkstation) throw new Error("NOT_FOUND: Workstation not found");

  // Complex cascade delete logic safely tucked inside a transaction in the service
  await prisma.$transaction(async (tx) => {
    await tx.inventory_assets.updateMany({
      where: { workstation_id: workstationId },
      data: { workstation_id: null },
    });
    await tx.report_workstation_items.deleteMany({
      where: { workstation_id: workstationId },
    });
    await tx.pmc_reports.deleteMany({
      where: { workstation_id: workstationId },
    });
    await tx.workstations.delete({ where: { workstation_id: workstationId } });
  });

  return { message: "Workstation and its relations deleted successfully" };
};

export const batchCreateWorkstations = async (workstations: any[]) => {
  if (!Array.isArray(workstations) || workstations.length === 0) {
    throw new Error(
      "VALIDATION: Invalid data format. Expected an array of workstations.",
    );
  }

  // 1. Validation
  const validationErrors: string[] = [];
  for (const [index, ws] of workstations.entries()) {
    if (!ws.workstation_name || typeof ws.workstation_name !== "string")
      validationErrors.push(
        `Workstation ${index + 1}: Missing or invalid name`,
      );
    if (!ws.lab_id || isNaN(Number(ws.lab_id)))
      validationErrors.push(
        `Workstation ${index + 1}: Missing or invalid lab_id`,
      );
  }
  if (validationErrors.length > 0)
    throw new Error(`VALIDATION: ${validationErrors.join(", ")}`);

  // 2. Check Lab Existence
  const labIds = [...new Set(workstations.map((ws) => Number(ws.lab_id)))];
  const existingLabs = await prisma.laboratories.findMany({
    where: { lab_id: { in: labIds } },
    select: { lab_id: true },
  });
  const missingLabIds = labIds.filter(
    (id) => !existingLabs.find((lab) => lab.lab_id === id),
  );
  if (missingLabIds.length > 0)
    throw new Error(
      `VALIDATION: Lab IDs not found: ${missingLabIds.join(", ")}`,
    );

  // 3. Check Duplicates
  const existingWorkstations = await prisma.workstations.findMany({
    where: {
      OR: workstations.map((ws) => ({
        workstation_name: ws.workstation_name.trim(),
        lab_id: Number(ws.lab_id),
      })),
    },
    select: { workstation_name: true, lab_id: true },
  });
  if (existingWorkstations.length > 0) {
    const duplicates = existingWorkstations.map(
      (ws) => `"${ws.workstation_name}" in Lab ID: ${ws.lab_id}`,
    );
    throw new Error(
      `DUPLICATE: These workstations already exist: ${duplicates.join(", ")}`,
    );
  }

  const result = await prisma.workstations.createMany({
    data: workstations.map((ws: any) => ({
      workstation_name: ws.workstation_name.trim(),
      lab_id: Number(ws.lab_id),
      workstation_remarks: ws.workstation_remarks || null,
      status_id: ws.status_id ? Number(ws.status_id) : 1,
    })),
  });

  return {
    message: `Successfully created ${result.count} workstation(s)`,
    count: result.count,
    created: result.count,
  };
};

export const getWorkstationsByLab = async (labId: number) => {
  return prisma.workstations.findMany({
    where: { lab_id: labId },
    include: { asset_statuses: true, inventory_assets: true },
    orderBy: { workstation_name: "asc" },
  });
};
