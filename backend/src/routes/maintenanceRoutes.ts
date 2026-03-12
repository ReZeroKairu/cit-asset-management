import { Router } from "express";
import {
  getLabPMCReports,
  getPMCReportDetail,
  createPMCReport,
  getServiceHistory,
  createRepairLog,
  getMaintenanceAnalytics,
} from "../controllers/maintenanceController";
import { authenticateToken } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";

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
router.post("/pmc", auditMiddleware("CREATE", "PMC report"), createPMCReport);

// 4. Get service history for a workstation
// GET /api/maintenance/pmc/history?workstation_id=5&quarter=1st
router.get("/pmc/history", getServiceHistory);

// 5. Create a repair/replacement log
// POST /api/maintenance/pmc/repair
router.post("/pmc/repair", auditMiddleware("CREATE", "repair log"), createRepairLog);

// 6. Get preventive maintenance analytics for dashboard
// GET /api/maintenance/analytics
router.get("/analytics", getMaintenanceAnalytics);

export default router;
