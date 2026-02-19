import { Router } from "express";
import {
  getLaboratories,
  getLaboratoryById,
  createLaboratory,
  updateLaboratory,
  deleteLaboratory,
} from "../controllers/labController";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// Public routes (no authentication required)
router.get("/public", getLaboratories);
router.get("/public/:labName/custodian", getLaboratoryById);

// Protected routes (authentication required)
router.use(authenticateToken);
router.get("/", getLaboratories);
router.get("/:id", getLaboratoryById);

// Admin only
router.post("/", requireRole(["Admin"]), createLaboratory);
router.put("/:id", requireRole(["Admin"]), updateLaboratory);
router.delete("/:id", requireRole(["Admin"]), deleteLaboratory);

export default router;
