import { Router } from "express";
import {
  getLabPMCReports,
  getPMCReportDetail,
  createPMCReport,
  getServiceHistory,
  createRepairLog,
  getMaintenanceAnalytics,
  getLabSchedules,
  upsertSchedules,
  deleteLabSchedules,
  getWorkstationPMCReportsBatch,
  getMaintenanceServicesByDate,
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

// 2.5. Get multiple PMC reports for workstations (Batch)
// GET /api/maintenance/pmc/batch?workstation_ids=1,2,3&quarter=1st
router.get("/pmc/batch", getWorkstationPMCReportsBatch);

// 3. Create a new PMC Report
// POST /api/maintenance/pmc
router.post("/pmc", auditMiddleware("CREATE", "PMC report"), createPMCReport);

// 4. Get service history for a workstation
// GET /api/maintenance/pmc/history?workstation_id=5&quarter=1st
router.get("/pmc/history", getServiceHistory);

// 5. Create a repair/replacement log
// POST /api/maintenance/pmc/repair
router.post("/pmc/repair", createRepairLog);

// 6. Get preventive maintenance analytics for dashboard
// GET /api/maintenance/analytics
router.get("/analytics", getMaintenanceAnalytics);

// 7. Get maintenance services by date (for reports)
// GET /api/maintenance/services-by-date?date=2025-01-15&lab_id=1
router.get("/services-by-date", getMaintenanceServicesByDate);

// ✅ SCHEDULE MANAGEMENT ROUTES

// 7. Get all schedules for a lab and fiscal year
// GET /api/maintenance/schedules?lab_id=1&fiscal_year=2025-2026
router.get("/schedules", getLabSchedules);

// 8. Create or update schedules for a lab
// POST /api/maintenance/schedules
router.post("/schedules", upsertSchedules);

// 9. Delete all schedules for a lab and fiscal year
// DELETE /api/maintenance/schedules?lab_id=1&fiscal_year=2025-2026
router.delete("/schedules", deleteLabSchedules);

export default router;
