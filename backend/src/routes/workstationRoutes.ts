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
import { auditMiddleware } from "../middleware/audit";

const router = Router();

router.use(authenticateToken);

router.get("/", getAllWorkstations);
router.post("/", auditMiddleware("CREATE", "workstation"), createWorkstation);
router.post(
  "/batch",
  auditMiddleware("CREATE", "workstations"),
  batchCreateWorkstations,
);

// ✅ 2. ADD THIS ROUTE HERE (Must be BEFORE /:name)
router.get("/lab/:labId", getWorkstationsByLab);

// Generic parameter routes come last
router.get("/:name", getWorkstationDetails);
router.put("/:id", auditMiddleware("UPDATE", "workstation"), updateWorkstation);
router.delete(
  "/:id",
  auditMiddleware("DELETE", "workstation"),
  deleteWorkstation,
);

export default router;
