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

const router = Router();

router.use(authenticateToken);

// Standard Reports
router.get("/", getAllDailyReports);
router.get("/my", getMyDailyReports);
router.get("/archived", getArchivedReports);
router.get("/:id", getDailyReportById);
router.post("/", createDailyReport);
router.put("/:id", updateDailyReport);
router.delete("/:id", requireRole(["Admin"]), deleteDailyReport);

// Workstation Checklists inside Reports
router.get("/:id/workstations", getWorkstationChecklist);
router.post("/:id/workstations", saveWorkstationChecklist);
router.get("/utils/lab-workstations", getLabWorkstationsForReport); // Changed path slightly to avoid collision

// Procedures inside Reports
router.get("/utils/all-procedures", getAllProcedures);
router.get("/:id/procedures", getReportProcedures);
router.post("/:id/procedures", saveReportProcedures);
router.get("/utils/workstation-procedures", getWorkstationProcedures);

export default router;
