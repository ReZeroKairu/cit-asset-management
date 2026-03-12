import { Router } from "express";
import {
  getAllDailyReports,
  getMyDailyReports,
  getArchivedReports,
  getDailyReportById,
  createDailyReport,
  updateDailyReport,
  deleteDailyReport,
} from "../controllers/dailyReportController";
import {
  getLabWorkstationsForReport,
  saveWorkstationChecklist,
  getWorkstationChecklist,
} from "../controllers/workstationReportController";
import {
  getAllProcedures,
  getReportProcedures,
  saveReportProcedures,
  getWorkstationProcedures,
} from "../controllers/proceduresController";
import { authenticateToken, requireRole } from "../middleware/auth";
import { auditMiddleware } from '../middleware/audit';

const router = Router();

router.use(authenticateToken);

// Standard Reports
router.get("/", getAllDailyReports);
router.get("/my", getMyDailyReports);
router.get("/archived", getArchivedReports);
router.get("/:id", getDailyReportById);
router.post("/", auditMiddleware("CREATE", "daily report"), createDailyReport);
router.put("/:id", auditMiddleware("UPDATE", "daily report"), updateDailyReport);
router.delete("/:id", requireRole(["Admin"]), auditMiddleware("DELETE", "daily report"), deleteDailyReport);

// Workstation Checklists inside Reports
router.get("/:id/workstations", getWorkstationChecklist);
router.post("/:id/workstations", auditMiddleware("CREATE", "workstation checklist"), saveWorkstationChecklist);
router.get("/utils/lab-workstations", getLabWorkstationsForReport); // Changed path slightly to avoid collision

// Procedures inside Reports
router.get("/utils/all-procedures", getAllProcedures);
router.get("/:id/procedures", getReportProcedures);
router.post("/:id/procedures", auditMiddleware("CREATE", "report procedures"), saveReportProcedures);
router.get("/utils/workstation-procedures", getWorkstationProcedures);

export default router;
