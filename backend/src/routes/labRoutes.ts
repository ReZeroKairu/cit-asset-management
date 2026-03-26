import { Router } from "express";
import {
  getLaboratories,
  getLaboratoryById,
  createLaboratory,
  updateLaboratory,
  deleteLaboratory,
} from "../controllers/labController";
import { authenticateToken, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";

const router = Router();

// Public routes (no authentication required)
router.get("/public", getLaboratories);
router.get("/public/:labName/custodian", getLaboratoryById);

// Protected routes (authentication required)
router.use(authenticateToken);
router.get("/", getLaboratories);
router.get("/:id", getLaboratoryById);

// Admin only
router.post("/", requireRole(["Admin"]), auditMiddleware("CREATE", "laboratory"), createLaboratory);
router.put("/:id", requireRole(["Admin"]), auditMiddleware("UPDATE", "laboratory"), updateLaboratory);
router.delete("/:id", requireRole(["Admin"]), auditMiddleware("DELETE", "laboratory"), deleteLaboratory);

export default router;
