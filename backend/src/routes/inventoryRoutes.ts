import { Router } from "express";
import {
  getInventory,
  createAsset,
  batchCreateAssets,
  updateAsset,
  deleteAsset,
  getAssetStatuses,
} from "../controllers/inventoryController";
import {
  getLifecycleTimeline,
  getLifecycleSummary,
  getUnits,
  createUnit,
  getDeviceTypes,
  resolveWorkstation,
} from "../controllers/inventoryExtrasController";
import { authenticateToken, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";

const router = Router();

router.get("/test", (req, res) =>
  res.json({
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
  }),
);

router.get("/", authenticateToken, getInventory);
router.post(
  "/",
  authenticateToken,
  auditMiddleware("CREATE", "inventory"),
  createAsset,
);
router.post(
  "/batch",
  authenticateToken,
  auditMiddleware("CREATE", "inventory"),
  batchCreateAssets,
);
router.put(
  "/:id",
  authenticateToken,
  auditMiddleware("UPDATE", "inventory"),
  updateAsset,
);
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["Admin", "Custodian"]),
  auditMiddleware("DELETE", "inventory"),
  deleteAsset,
);
router.get("/statuses", getAssetStatuses);

// Newly routed endpoints
router.get("/lifecycle-timeline", authenticateToken, getLifecycleTimeline);
router.get("/lifecycle-summary", authenticateToken, getLifecycleSummary);
router.get("/units", getUnits);
router.post(
  "/units",
  authenticateToken,
  requireRole(["Admin", "Custodian"]),
  auditMiddleware("CREATE", "units"),
  createUnit,
);
router.get("/device-types", getDeviceTypes);
router.get("/resolve-workstation", authenticateToken, resolveWorkstation);

export default router;
