import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  getInventory,
  createAsset,
  batchCreateAssets,
  updateAsset,
  deleteAsset,
  getAssetStatuses, // ✅ IMPORT THIS
} from "../controllers/inventoryController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Public access for GET requests (for complaints form)
router.get("/", getInventory);

// Protected routes require authentication
router.post("/", authenticateToken, createAsset);
router.post("/batch", authenticateToken, batchCreateAssets);
router.put("/:id", authenticateToken, updateAsset);
router.delete("/:id", authenticateToken, deleteAsset);

// ✅ ADD THIS ROUTE
router.get("/statuses", getAssetStatuses);

// Resources
router.get("/units", async (req: Request, res: Response) => {
  try {
    const { device_type_id } = req.query;
    const where = device_type_id
      ? { device_type_id: Number(device_type_id) }
      : {};
    const units = await prisma.units.findMany({ where });
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch units" });
  }
});

router.get("/device-types", async (req: Request, res: Response) => {
  try {
    const deviceTypes = await prisma.device_types.findMany();
    res.json(deviceTypes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch device types" });
  }
});

export default router;
