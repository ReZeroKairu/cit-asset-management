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
