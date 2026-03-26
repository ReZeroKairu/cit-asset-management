import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET ALL ASSETS
export const getInventory = async (req: Request, res: Response) => {
  try {
    const { workstation_id, lab_id } = req.query;
    const user = req.user;

    // Build where clause based on query parameters and user role
    let whereClause: any = {};

    if (workstation_id) {
      whereClause.workstation_id = Number(workstation_id);
    }

    if (lab_id) {
      whereClause.lab_id = Number(lab_id);
    }

    // Role-based access control
    if (user?.role === "Custodian") {
      if (user.lab_id) {
        // Custodians can only see assets from their assigned lab
        // If they're already filtering by their lab, allow it
        // Otherwise, restrict to their lab
        if (!whereClause.lab_id) {
          whereClause.lab_id = user.lab_id;
        } else if (whereClause.lab_id !== user.lab_id) {
          // Custodian trying to access assets from a lab they're not assigned to
          return res.status(403).json({ error: "Access denied: You can only view assets from your assigned laboratory" });
        }
      } else {
        // Unassigned custodians should see nothing
        whereClause.lab_id = -1; // Impossible lab_id that will return no results
      }
    }
    // Admins can see all assets (no additional filtering needed)

    const assets = await prisma.inventory_assets.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        asset_details: {
          include: {
            asset_statuses: true, // Include the status name (e.g. "Functional")
          },
        },
        laboratories: true,
        units: true,
        users: true,
        workstations: true, // Include workstation relationship
      },
      orderBy: {
        date_added: "desc",
      },
    });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assets" });
  }
};

// 2. CREATE NEW ASSET
export const createAsset = async (req: Request, res: Response) => {
  try {
    const {
      description,
      property_tag_no,
      serial_number,
      quantity,
      lab_id,
      unit_id,
      workstation_id,
      date_of_purchase,
      asset_remarks, // NEW
      status_id, // NEW
    } = req.body;

    // Get user ID from authenticated request
    const user_id = req.user?.userId;

    const newAsset = await prisma.inventory_assets.create({
      data: {
        lab_id: lab_id ? Number(lab_id) : null,
        unit_id: unit_id ? Number(unit_id) : null,
        workstation_id: workstation_id ? Number(workstation_id) : null,
        added_by_user_id: user_id ? Number(user_id) : null,

        asset_details: {
          create: {
            description,
            property_tag_no,
            serial_number,
            quantity: Number(quantity) || 1,
            date_of_purchase: date_of_purchase
              ? new Date(date_of_purchase)
              : null,
            asset_remarks: asset_remarks || null, // NEW
            status_id: status_id ? Number(status_id) : 1, // Default 1
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
    res.json(newAsset);
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(500).json({
      error: "Failed to create asset",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 3. BATCH CREATE ASSETS (FIXED TS ERRORS)
export const batchCreateAssets = async (req: Request, res: Response) => {
  try {
    const { assets } = req.body;

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ error: "Assets array is required" });
    }

    const user_id = req.user?.userId;

    // Validate inputs
    const validationErrors = [];
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      if (!asset.lab_id)
        validationErrors.push(`Asset ${i + 1}: Lab ID is required`);
      if (!asset.unit_id)
        validationErrors.push(`Asset ${i + 1}: Unit ID is required`);
    }

    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: validationErrors });
    }

    // Check Labs
    const labIds = [...new Set(assets.map((a) => a.lab_id))];
    const existingLabs = await prisma.laboratories.findMany({
      where: { lab_id: { in: labIds } },
      select: { lab_id: true },
    });
    // FIX: Added type check
    const missingLabs = labIds.filter(
      (id) => !existingLabs.find((lab: any) => lab.lab_id === id),
    );
    if (missingLabs.length > 0) {
      return res
        .status(400)
        .json({ error: "Invalid lab IDs", details: missingLabs });
    }

    // Check Units
    const unitIds = [...new Set(assets.map((a) => a.unit_id))];
    const existingUnits = await prisma.units.findMany({
      where: { unit_id: { in: unitIds } },
      select: { unit_id: true },
    });
    // FIX: Added type check
    const missingUnits = unitIds.filter(
      (id) => !existingUnits.find((unit: any) => unit.unit_id === id),
    );
    if (missingUnits.length > 0) {
      return res
        .status(400)
        .json({ error: "Invalid unit IDs", details: missingUnits });
    }

    // Check Workstations
    const workstationIds = assets
      .filter((a) => a.workstation_id)
      .map((a) => a.workstation_id!);
    if (workstationIds.length > 0) {
      const existingWorkstations = await prisma.workstations.findMany({
        where: { workstation_id: { in: workstationIds } },
        select: { workstation_id: true },
      });
      // FIX: Added type check
      const missingWorkstations = workstationIds.filter(
        (id) =>
          !existingWorkstations.find((ws: any) => ws.workstation_id === id),
      );
      if (missingWorkstations.length > 0) {
        return res.status(400).json({
          error: "Invalid workstation IDs",
          details: missingWorkstations,
        });
      }
    }

    // Create assets
    // FIX: Added type check for transaction client
    const createdAssets = await prisma.$transaction(async (tx: any) => {
      const results = [];
      for (const asset of assets) {
        try {
          const newAsset = await tx.inventory_assets.create({
            data: {
              lab_id: Number(asset.lab_id),
              unit_id: Number(asset.unit_id),
              workstation_id: asset.workstation_id
                ? Number(asset.workstation_id)
                : null,
              added_by_user_id: user_id ? Number(user_id) : null,
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
        } catch (error: any) {
          // Handle duplicate property_tag_no error
          if (error.code === 'P2002' && error.meta?.target === 'property_tag_no') {
            // Continue with other assets, don't fail the entire transaction
            continue;
          }
          // For other errors, re-throw
          throw error;
        }
      }
      return results;
    });
    res.status(201).json({
      message: `Successfully created ${createdAssets.length} assets`,
      assets: createdAssets,
    });
  } catch (error: any) {
    console.error("Batch Create Error:", error);
    res.status(500).json({ error: "Failed to create assets", details: error.message });
  }
};

// 4. DELETE ASSET
export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assetId = Number(id);

    if (!assetId || isNaN(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    // Check if asset exists
    const existingAsset = await prisma.inventory_assets.findUnique({
      where: { asset_id: assetId },
      include: {
        asset_details: true,
        complaints: true,
        service_log_assets: true
      }
    });

    if (!existingAsset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // Check for related records that might prevent deletion
    const relatedRecords = {
      asset_details: existingAsset.asset_details ? 1 : 0,
      complaints: existingAsset.complaints?.length || 0,
      service_log_assets: existingAsset.service_log_assets?.length || 0
    };

    // Check if there are related records that need cascade deletion
    const hasRelatedRecords = Object.values(relatedRecords).some(count => count > 0);

    // If there are related records, delete them first (cascade delete)
    if (hasRelatedRecords) {
      try {
        // Delete related records in the correct order (respecting foreign key constraints)
        
        // 1. Delete service log assets first
        if (relatedRecords.service_log_assets > 0) {
          await prisma.service_log_assets.deleteMany({
            where: { asset_id: assetId }
          });
        }
        
        // 2. Delete complaints
        if (relatedRecords.complaints > 0) {
          await prisma.complaints.deleteMany({
            where: { asset_id: assetId }
          });
        }
        
        // 3. Delete asset details
        if (relatedRecords.asset_details > 0) {
          await prisma.asset_details.delete({
            where: { asset_id: assetId }
          });
        }
        
        console.log(`Cascade delete completed for asset ${assetId}`);
      } catch (cascadeError) {
        return res.status(500).json({ 
          error: "Failed to delete related records",
          message: "Please contact administrator to delete this asset"
        });
      }
    }

    // Delete the asset
    await prisma.inventory_assets.delete({
      where: { asset_id: assetId },
    });

    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    
    // Check for foreign key constraint errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return res.status(400).json({ 
          error: "Cannot delete asset - it has related records",
          message: "Please remove related records first"
        });
      }
    }
    
    res.status(500).json({ error: "Failed to delete asset" });
  }
};

// 5. UPDATE ASSET
export const updateAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assetId = Number(id);

    const {
      description,
      property_tag_no,
      serial_number,
      quantity,
      lab_id,
      unit_id,
      workstation_id,
      date_of_purchase,
      asset_remarks,
      status_id,
    } = req.body;

    // ✅ FIX: We build an update object dynamically.
    // It only includes fields that were actually sent by the frontend.
    const updateData: any = {};
    if (lab_id !== undefined)
      updateData.lab_id = lab_id ? Number(lab_id) : null;
    if (unit_id !== undefined)
      updateData.unit_id = unit_id ? Number(unit_id) : null;
    if (workstation_id !== undefined)
      updateData.workstation_id = workstation_id
        ? Number(workstation_id)
        : null;

    const detailsData: any = {};
    if (description !== undefined) detailsData.description = description;
    if (property_tag_no !== undefined)
      detailsData.property_tag_no = property_tag_no;
    if (serial_number !== undefined) detailsData.serial_number = serial_number;
    if (quantity !== undefined) detailsData.quantity = Number(quantity) || 1;
    if (date_of_purchase !== undefined)
      detailsData.date_of_purchase = date_of_purchase
        ? new Date(date_of_purchase)
        : null;
    if (asset_remarks !== undefined)
      detailsData.asset_remarks = asset_remarks || null;
    if (status_id !== undefined)
      detailsData.status_id = status_id ? Number(status_id) : undefined;

    const updatedAsset = await prisma.inventory_assets.update({
      where: { asset_id: assetId },
      data: {
        ...updateData,
        // Only update details if there is details data to update
        ...(Object.keys(detailsData).length > 0 && {
          asset_details: {
            update: detailsData,
          },
        }),
      },
      include: {
        asset_details: {
          include: { asset_statuses: true },
        },
        laboratories: true,
        units: true,
        users: true,
        workstations: true,
      },
    });

    res.json(updatedAsset);
  } catch (error) {
    res.status(500).json({ error: "Failed to create asset" });
  }
};

// ✅ NEW: Get all asset statuses
export const getAssetStatuses = async (req: Request, res: Response) => {
  try {
    const statuses = await prisma.asset_statuses.findMany();
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch asset statuses" });
  }
};
