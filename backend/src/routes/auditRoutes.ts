import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import * as AuditController from "../controllers/auditController";

const router = Router();

// Secure all audit routes
router.use(authenticateToken);
router.use(requireRole(["Admin", "Custodian"]));

router.get("/", AuditController.getAuditLogs);
router.get("/recent", AuditController.getRecentAuditLogs);
router.get("/statistics", AuditController.getAuditStatistics);
router.get("/user/:userId", AuditController.getUserAuditLogs);
router.get("/system", AuditController.getSystemAuditLogs);
router.get("/high-priority", AuditController.getHighPriorityAuditLogs);

export default router;
