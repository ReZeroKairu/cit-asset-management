import { Router } from "express";
import { login, verifyPassword } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";

const router = Router();

router.post("/login", auditMiddleware("LOGIN", "USER"), login);

// Password verification endpoint (requires authentication)
router.post("/verify-password", authenticateToken, verifyPassword);

export default router;
