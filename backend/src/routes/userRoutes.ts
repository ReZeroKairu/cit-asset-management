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

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

router.get("/profile", getUserProfile);
router.get("/assigned-lab", getUserAssignedLab);
router.get("/organization-data", getOrganizationData);

// Admin only routes
router.get("/assignments", requireRole(["Admin"]), getAllUsersWithAssignments);
router.put("/assign-lab", requireRole(["Admin"]), assignUserToLab);
router.post("/", requireRole(["Admin"]), createUser);
router.put("/:id", requireRole(["Admin"]), updateUser);
router.delete("/:id", requireRole(["Admin"]), deleteUser);

export default router;
