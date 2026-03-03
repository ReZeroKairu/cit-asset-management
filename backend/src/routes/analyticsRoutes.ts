//backend/src/routes/analyticsRoutes.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { getInventoryAnalytics } from "../controllers/inventoryAnalyticsController";

const router = Router();

// All analytics routes require authentication and admin role
router.use(authenticateToken);

// GET: Get inventory analytics (admin only)
router.get("/inventory", getInventoryAnalytics);

export default router;
