import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";
import { validate, complaintSchema } from "../middleware/validation";
import { auditMiddleware } from "../middleware/audit";
import * as ComplaintsController from "../controllers/complaintsController";

const router = express.Router();
const prisma = new PrismaClient(); // Keep only if strictly needed for audit hack below

// Public custom audit wrapper (since it needs raw DB access for public forms)
const publicComplaintAudit = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const auditData: any = {
    action: "CREATE",
    description: "CREATE public complaint",
    user_agent: req.headers["user-agent"] as string,
  };
  if (req.body.lab_id) {
    auditData.lab_id = req.body.lab_id;
    auditData.user_id = null;
  }
  await prisma.audit_logs.create({ data: auditData }).catch(() => {});
  next();
};

// Public Routes (No Auth)
router.post(
  "/",
  validate(complaintSchema),
  publicComplaintAudit,
  ComplaintsController.createComplaint,
);
router.get("/public-laboratories", ComplaintsController.getPublicLaboratories);
router.get(
  "/public-laboratories/:labId/workstations",
  ComplaintsController.getWorkstationsByLab,
);
router.get(
  "/public-workstations/:workstationId/assets",
  ComplaintsController.getAssetsByWorkstation,
);
router.get(
  "/public-check-asset/:assetId",
  ComplaintsController.checkAssetComplaints,
);

// Protected Routes (Auth Required)
router.post(
  "/authenticated",
  authenticateToken,
  auditMiddleware("CREATE", "complaint"),
  validate(complaintSchema),
  ComplaintsController.createComplaint,
);
router.get(
  "/laboratories",
  authenticateToken,
  ComplaintsController.getLaboratories,
);
router.get(
  "/laboratories/:labId/workstations",
  authenticateToken,
  ComplaintsController.getWorkstationsByLab,
);
router.get(
  "/analytics",
  authenticateToken,
  ComplaintsController.getComplaintsAnalytics,
);
router.get(
  "/check-asset/:assetId",
  authenticateToken,
  ComplaintsController.checkAssetComplaints,
);
router.get("/", authenticateToken, ComplaintsController.getAllComplaints);
router.get(
  "/:complaintId",
  authenticateToken,
  ComplaintsController.getComplaintById,
);
router.put(
  "/:complaintId/status",
  authenticateToken,
  auditMiddleware("UPDATE", "complaint status"),
  ComplaintsController.updateComplaintStatus,
);
router.put(
  "/:complaintId/remarks",
  authenticateToken,
  auditMiddleware("UPDATE", "complaint remarks"),
  ComplaintsController.updateComplaintRemarks,
);

export default router;
