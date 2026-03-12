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
import { authenticateToken, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";

const router = Router();
const prisma = new PrismaClient();

// Protected routes require authentication
router.get("/", authenticateToken, getInventory);

// Protected routes require authentication
router.post("/", authenticateToken, auditMiddleware("CREATE", "inventory"), createAsset);
router.post("/batch", authenticateToken, auditMiddleware("CREATE", "inventory"), batchCreateAssets);
router.put("/:id", authenticateToken, auditMiddleware("UPDATE", "inventory"), updateAsset);
router.delete("/:id", authenticateToken, requireRole(["Admin", "Custodian"]), auditMiddleware("DELETE", "inventory"), deleteAsset);

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
