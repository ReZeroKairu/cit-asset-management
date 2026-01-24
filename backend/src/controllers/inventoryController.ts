import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch all assets with relations
export const getInventory = async (req: Request, res: Response) => {
  try {
    const assets = await prisma.inventory_assets.findMany({
      include: {
        laboratories: true, // Get Lab Name instead of just ID
        units: true, // Get Unit Name (e.g., "System Unit")
        users: true, // Get who added it
      },
      orderBy: {
        date_added: "desc",
      },
    });
    res.json(assets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
};

// POST: Create a new asset
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
      date_of_purchase,
      supplier_name,
      user_id,
    } = req.body;

    const newAsset = await prisma.inventory_assets.create({
      data: {
        item_name,
        description,
        property_tag_no,
        serial_number,
        quantity: Number(quantity),
        date_of_purchase: new Date(date_of_purchase),
        supplier_name,
        // Connect Foreign Keys
        laboratories: { connect: { lab_id: Number(lab_id) } },
        units: { connect: { unit_id: Number(unit_id) } },
        users: { connect: { user_id: Number(user_id) } },
      },
    });
    res.json(newAsset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create asset" });
  }
};
