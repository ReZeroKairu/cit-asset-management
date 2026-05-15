import express from "express";
import {
  createSoftwareInstallation,
  getSoftwareInstallations,
  updateSoftwareInstallationStatus,
  updateSoftwareInstallationDetails,
} from "../controllers/formsController";
import { authenticateToken } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Software Installation Routes
router.post(
  "/software-installations",
  auditMiddleware("CREATE", "software installation"),
  createSoftwareInstallation,
);
router.get("/software-installations", getSoftwareInstallations);
router.put(
  "/software-installations/:id/status",
  auditMiddleware("UPDATE", "software installation status"),
  updateSoftwareInstallationStatus,
);
router.put(
  "/software-installations/:id",
  auditMiddleware("UPDATE", "software installation"),
  updateSoftwareInstallationDetails,
);

export default router;
