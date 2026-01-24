// 1. Import Request and Response types from 'express'
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 2. Add ": Request" and ": Response" to your parameters
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

    // 3. (Optional) Explicitly return the response to satisfy some void checks
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assets" });
  }
};
