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

router.use(authenticateToken);

router.get("/", getLaboratories);
router.get("/:id", getLaboratoryById);

// Admin only
router.post("/", requireRole(["Admin"]), createLaboratory);
router.put("/:id", requireRole(["Admin"]), updateLaboratory);
router.delete("/:id", requireRole(["Admin"]), deleteLaboratory);

export default router;
