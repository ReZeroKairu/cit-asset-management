import { Router } from "express";
import {
  getAllWorkstations,
  createWorkstation,
  batchCreateWorkstations,
  getWorkstationDetails,
  updateWorkstation,
  deleteWorkstation,
  getWorkstationsByLab, // 👈 1. ADD THIS IMPORT
} from "../controllers/workstationController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.get("/", getAllWorkstations);
router.post("/", createWorkstation);
router.post("/batch", batchCreateWorkstations);

// ✅ 2. ADD THIS ROUTE HERE (Must be BEFORE /:name)
router.get("/lab/:labId", getWorkstationsByLab);

// Generic parameter routes come last
router.get("/:name", getWorkstationDetails);
router.put("/:id", updateWorkstation);
router.delete("/:id", deleteWorkstation);

export default router;
