// backend/src/controllers/inventoryController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET ALL ASSETS
export const getInventory = async (req: Request, res: Response) => {
  try {
    const assets = await prisma.inventory_assets.findMany({
      include: {
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
      item_name,
      description,
      property_tag_no,
      serial_number,
      quantity,
      lab_id,
      unit_id,
      workstation_id,
      date_of_purchase,
      supplier_name,
    } = req.body;

    // Get user ID from authenticated request
    const user_id = req.user?.userId;

    const newAsset = await prisma.inventory_assets.create({
      data: {
        item_name,
        description,
        property_tag_no,
        serial_number,
        quantity: Number(quantity) || 1,
        date_of_purchase: date_of_purchase ? new Date(date_of_purchase) : null,
        supplier_name,
        // Connect Foreign Keys (optional)
        laboratories: lab_id ? { connect: { lab_id: Number(lab_id) } } : undefined,
        units: unit_id ? { connect: { unit_id: Number(unit_id) } } : undefined,
        workstation: workstation_id ? { connect: { workstation_id: Number(workstation_id) } } : undefined,
        users: user_id ? { connect: { user_id: Number(user_id) } } : undefined,
      },
      include: {
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

// 3. DELETE ASSET
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
      item_name,
      description,
      property_tag_no,
      serial_number,
      quantity,
      lab_id,
      unit_id,
      workstation_id,
      date_of_purchase,
      supplier_name,
    } = req.body;

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

    // Update the asset
    const updatedAsset = await prisma.inventory_assets.update({
      where: { asset_id: assetId },
      data: {
        item_name,
        description,
        property_tag_no,
        serial_number,
        quantity: Number(quantity) || 1,
        date_of_purchase: date_of_purchase ? new Date(date_of_purchase) : null,
        supplier_name,
        // Connect Foreign Keys (optional)
        laboratories: lab_id ? { connect: { lab_id: Number(lab_id) } } : undefined,
        units: unit_id ? { connect: { unit_id: Number(unit_id) } } : undefined,
        workstation: workstation_id ? { connect: { workstation_id: Number(workstation_id) } } : undefined,
      },
      include: {
        laboratories: true,
        units: true,
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
