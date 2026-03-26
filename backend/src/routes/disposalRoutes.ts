import { Router } from "express";
import {
  createDisposal,
  getAllDisposals,
  getDisposalById,
  updateDisposal,
  deleteDisposal,
  getDisposalStatistics,
  getAvailableAssetsForDisposal,
} from "../controllers/disposalController";
import { authenticateToken } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const router = Router();

// ✅ DISPOSAL ROUTES

// 0. TEST Route - Simple connection test (before auth)
router.get("/test", (req, res) => {
  console.log("🔍 Test route called");
  res.json({
    message: "Test route working",
    timestamp: new Date().toISOString(),
    test: true
  });
});

// 0.5. SIMPLE Route - Test basic database query
router.get("/simple", async (req, res) => {
  console.log("🔍 Simple route called");
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM asset_disposals`;
    console.log("✅ Simple query result:", result);
    
    // Handle BigInt serialization
    const count = (result as any[])[0]?.count;
    const safeCount = typeof count === 'bigint' ? Number(count) : count;
    
    res.json({
      message: "Simple query working",
      count: safeCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("❌ Simple query error:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

// Apply authentication to all routes AFTER test routes
router.use(authenticateToken);

// 1. Create new disposal record
// POST /api/disposals
router.post("/", auditMiddleware("CREATE", "Asset disposal"), createDisposal);

// 2. Get all disposals with filtering
// GET /api/disposals?disposal_method=Scrap&date_from=2024-01-01&date_to=2024-12-31&workstation_name=Lab1
router.get("/", getAllDisposals);

// 3. Get single disposal by ID
// GET /api/disposals/:id
router.get("/:id", getDisposalById);

// 4. Update disposal record
// PUT /api/disposals/:id
router.put("/:id", auditMiddleware("UPDATE", "Asset disposal"), updateDisposal);

// 5. Delete disposal record (with optional restore)
// DELETE /api/disposals/:id?restore=true
router.delete("/:id", auditMiddleware("DELETE", "Asset disposal"), deleteDisposal);

// 6. Get disposal statistics
// GET /api/disposals/statistics
router.get("/statistics/overview", getDisposalStatistics);

// 7. Get assets available for disposal
// GET /api/disposals/assets/available
router.get("/assets/available", getAvailableAssetsForDisposal);

export default router;
