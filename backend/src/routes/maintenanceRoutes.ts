// backend/src/routes/maintenanceRoutes.ts
import { Router } from "express";
import {
  getAllMaintenanceReports,
  getMaintenanceReportById,
  createMaintenanceReport,
  updateMaintenanceReport,
  deleteMaintenanceReport,
} from "../controllers/maintenanceController";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get("/", getAllMaintenanceReports);
router.get("/:id", getMaintenanceReportById);
router.post("/", createMaintenanceReport);
router.put("/:id", updateMaintenanceReport);

// Only Admins can delete reports
router.delete("/:id", requireRole(["Admin"]), deleteMaintenanceReport);

// Re-use the workstation utility from daily reports logic if needed
// Or simply rely on the frontend calling the existing /daily-reports/utils endpoints

export default router;
