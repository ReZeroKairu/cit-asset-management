import { Router } from "express";
import { login, verifyPassword } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.post("/verify-password", authenticateToken, verifyPassword);

export default router;
