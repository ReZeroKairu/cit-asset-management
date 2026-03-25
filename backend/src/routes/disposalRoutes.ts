import { Router } from "express";
import {
  createDisposal,
  getAllDisposals,
  getDisposalById,
  updateDisposal,
  deleteDisposal,
  getDisposalStatistics,
  getAvailableAssetsForDisposal,
} from "../controllers/disposalController";
import { authenticateToken } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ✅ DISPOSAL ROUTES

// 1. Create new disposal record
// POST /api/disposals
router.post("/", auditMiddleware("CREATE", "Asset disposal"), createDisposal);

// 2. Get all disposals with filtering
// GET /api/disposals?disposal_method=Scrap&date_from=2024-01-01&date_to=2024-12-31&workstation_name=Lab1
router.get("/", getAllDisposals);

// 3. Get single disposal by ID
// GET /api/disposals/:id
router.get("/:id", getDisposalById);

// 4. Update disposal record
// PUT /api/disposals/:id
router.put("/:id", auditMiddleware("UPDATE", "Asset disposal"), updateDisposal);

// 5. Delete disposal record (with optional restore)
// DELETE /api/disposals/:id?restore=true
router.delete("/:id", auditMiddleware("DELETE", "Asset disposal"), deleteDisposal);

// 6. Get disposal statistics
// GET /api/disposals/statistics
router.get("/statistics/overview", getDisposalStatistics);

// 7. Get assets available for disposal
// GET /api/disposals/assets/available
router.get("/assets/available", getAvailableAssetsForDisposal);

export default router;
