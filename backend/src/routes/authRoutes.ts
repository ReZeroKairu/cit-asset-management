import { Router } from "express";
import { login } from "../controllers/authController";
import { auditMiddleware } from "../middleware/audit";

const router = Router();

router.post("/login", auditMiddleware("LOGIN", "USER"), login);

export default router;
