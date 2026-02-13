import { Router } from "express";
import {
  getLabPMCReports,
  getPMCReportDetail,
  createPMCReport,
} from "../controllers/maintenanceController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ✅ PMC Routes (Matches your new frontend API calls)

// 1. Get all reports for a specific Lab & Quarter
// GET /api/maintenance/pmc?lab_id=1&quarter=1st
router.get("/pmc", getLabPMCReports);

// 2. Get specific report details for a Workstation & Quarter
// GET /api/maintenance/pmc/detail?workstation_id=5&quarter=1st
router.get("/pmc/detail", getPMCReportDetail);

// 3. Create a new PMC Report
// POST /api/maintenance/pmc
router.post("/pmc", createPMCReport);

export default router;
