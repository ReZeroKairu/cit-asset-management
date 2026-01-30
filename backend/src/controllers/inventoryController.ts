// backend/src/controllers/inventoryController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET ALL ASSETS
export const getInventory = async (req: Request, res: Response) => {
  try {
    const { workstation_id, lab_id } = req.query;
    
    // Build where clause based on query parameters
    let whereClause: any = {};
    
    if (workstation_id) {
      whereClause.workstation_id = Number(workstation_id);
    }
    
    if (lab_id) {
      whereClause.lab_id = Number(lab_id);
    }

    const assets = await prisma.inventory_assets.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        details: true,
        laboratories: true,
        units: true,
        users: true,
        workstation: true,
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
    } = req.body;

    // Get user ID from authenticated request
    const user_id = req.user?.userId;

    // Create the asset with nested details
    const newAsset = await prisma.inventory_assets.create({
      data: {
        // Main asset record (logistics)
        lab_id: lab_id ? Number(lab_id) : null,
        unit_id: unit_id ? Number(unit_id) : null,
        workstation_id: workstation_id ? Number(workstation_id) : null,
        added_by_user_id: user_id ? Number(user_id) : null,
        
        // Nested details record
        details: {
          create: {
            description,
            property_tag_no,
            serial_number,
            quantity: Number(quantity) || 1,
            date_of_purchase: date_of_purchase ? new Date(date_of_purchase) : null,
          },
        },
      },
      include: {
        details: true,
        laboratories: true,
        units: true,
        users: true,
        workstation: true,
      },
    });
    res.json(newAsset);
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(500).json({ 
      error: "Failed to create asset",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// 3. BATCH CREATE ASSETS
export const batchCreateAssets = async (req: Request, res: Response) => {
  try {
    const { assets } = req.body;

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ error: "Assets array is required" });
    }

    // Get user ID from authenticated request
    const user_id = req.user?.userId;

    // Validate each asset
    const validationErrors = [];
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      
      if (!asset.lab_id) {
        validationErrors.push(`Asset ${i + 1}: Lab ID is required`);
      }
      
      if (!asset.unit_id) {
        validationErrors.push(`Asset ${i + 1}: Unit ID is required`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationErrors 
      });
    }

    // Check if labs exist
    const labIds = [...new Set(assets.map(a => a.lab_id))];
    const existingLabs = await prisma.laboratories.findMany({
      where: { lab_id: { in: labIds } },
      select: { lab_id: true, lab_name: true }
    });

    const missingLabs = labIds.filter(id => !existingLabs.find(lab => lab.lab_id === id));
    if (missingLabs.length > 0) {
      return res.status(400).json({ 
        error: "Invalid lab IDs", 
        details: `Lab IDs not found: ${missingLabs.join(', ')}` 
      });
    }

    // Check if units exist
    const unitIds = [...new Set(assets.map(a => a.unit_id))];
    const existingUnits = await prisma.units.findMany({
      where: { unit_id: { in: unitIds } },
      select: { unit_id: true, unit_name: true }
    });

    const missingUnits = unitIds.filter(id => !existingUnits.find(unit => unit.unit_id === id));
    if (missingUnits.length > 0) {
      return res.status(400).json({ 
        error: "Invalid unit IDs", 
        details: `Unit IDs not found: ${missingUnits.join(', ')}` 
      });
    }

    // Check if workstations exist (if provided)
    const workstationIds = assets
      .filter(a => a.workstation_id)
      .map(a => a.workstation_id!);
    
    if (workstationIds.length > 0) {
      const existingWorkstations = await prisma.workstations.findMany({
        where: { workstation_id: { in: workstationIds } },
        select: { workstation_id: true, workstation_name: true }
      });

      const missingWorkstations = workstationIds.filter(id => !existingWorkstations.find(ws => ws.workstation_id === id));
      if (missingWorkstations.length > 0) {
        return res.status(400).json({ 
          error: "Invalid workstation IDs", 
          details: `Workstation IDs not found: ${missingWorkstations.join(', ')}` 
        });
      }
    }

    // Create assets in batch
    const createdAssets = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const asset of assets) {
        const newAsset = await tx.inventory_assets.create({
          data: {
            lab_id: Number(asset.lab_id),
            unit_id: Number(asset.unit_id),
            workstation_id: asset.workstation_id ? Number(asset.workstation_id) : null,
            added_by_user_id: user_id ? Number(user_id) : null,
            
            // Nested details record
            details: {
              create: {
                property_tag_no: asset.property_tag_no || null,
                description: asset.description?.trim() || "",
                serial_number: asset.serial_number?.trim() || "",
                quantity: Number(asset.quantity) || 1,
                date_of_purchase: asset.date_of_purchase ? new Date(asset.date_of_purchase) : null,
              },
            },
          },
          include: {
            details: true,
            laboratories: true,
            units: true,
            users: true,
            workstation: true,
          },
        });
        
        results.push(newAsset);
      }
      
      return results;
    });

    res.status(201).json({
      message: `Successfully created ${createdAssets.length} assets`,
      assets: createdAssets
    });

  } catch (error: any) {
    console.error("Batch Create Assets Error:", error);
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Duplicate entry detected" });
    }
    
    if (error.code === 'P2025') {
      return res.status(400).json({ error: "Related record not found" });
    }
    
    res.status(500).json({ 
      error: "Failed to create assets",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// 4. DELETE ASSET
export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assetId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);

    if (!assetId) {
      return res.status(400).json({ error: "Asset ID is required" });
    }

    // Check if asset exists
    const existingAsset = await prisma.inventory_assets.findUnique({
      where: { asset_id: assetId }
    });

    if (!existingAsset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // Delete the asset
    await prisma.inventory_assets.delete({
      where: { asset_id: assetId }
    });

    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ error: "Failed to delete asset" });
  }
};

// 4. UPDATE ASSET
export const updateAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assetId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
    
    const {
      description,
      property_tag_no,
      serial_number,
      quantity,
      lab_id,
      unit_id,
      workstation_id,
      date_of_purchase,
    } = req.body;

    if (!assetId) {
      return res.status(400).json({ error: "Asset ID is required" });
    }

    // Check if asset exists
    const existingAsset = await prisma.inventory_assets.findUnique({
      where: { asset_id: assetId },
      include: { details: true }
    });

    if (!existingAsset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // Update both the main asset record and the details
    const updatedAsset = await prisma.inventory_assets.update({
      where: { asset_id: assetId },
      data: {
        // Update main asset record (logistics)
        lab_id: lab_id ? Number(lab_id) : null,
        unit_id: unit_id ? Number(unit_id) : null,
        workstation_id: workstation_id ? Number(workstation_id) : null,
        
        // Update nested details record
        details: existingAsset.details ? {
          update: {
            description,
            property_tag_no,
            serial_number,
            quantity: Number(quantity) || 1,
            date_of_purchase: date_of_purchase ? new Date(date_of_purchase) : null,
          },
        } : {
          create: {
            description,
            property_tag_no,
            serial_number,
            quantity: Number(quantity) || 1,
            date_of_purchase: date_of_purchase ? new Date(date_of_purchase) : null,
          },
        },
      },
      include: {
        details: true,
        laboratories: true,
        units: true,
        users: true,
        workstation: true,
      },
    });

    res.json(updatedAsset);
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({ 
      error: "Failed to update asset",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
