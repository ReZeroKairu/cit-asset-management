import { Router } from "express";
import {
  getOrganizationData,
  createUser,
  getUserProfile,
  getUserAssignedLab,
  getAllUsersWithAssignments,
  assignUserToLab,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { authenticateToken, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

router.get("/profile", getUserProfile);
router.get("/assigned-lab", getUserAssignedLab);
router.get("/organization-data", getOrganizationData);

// Admin only routes
router.get("/assignments", requireRole(["Admin"]), getAllUsersWithAssignments);
router.put("/assign-lab", requireRole(["Admin"]), auditMiddleware("UPDATE", "user assignment"), assignUserToLab);
router.post("/", requireRole(["Admin"]), auditMiddleware("CREATE", "user"), createUser);
router.put("/:id", requireRole(["Admin"]), auditMiddleware("UPDATE", "user"), updateUser);
router.delete("/:id", requireRole(["Admin"]), auditMiddleware("DELETE", "user"), deleteUser);

export default router;
