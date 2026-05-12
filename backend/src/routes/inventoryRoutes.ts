import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  getInventory,
  createAsset,
  batchCreateAssets,
  updateAsset,
  deleteAsset,
  getAssetStatuses, // ✅ IMPORT THIS
} from "../controllers/inventoryController";
import { authenticateToken, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";

const router = Router();
const prisma = new PrismaClient();

// Add a simple test endpoint to verify backend is working
router.get("/test", (req, res) => {
  res.json({ message: "Backend is working!", timestamp: new Date().toISOString() });
});

// Protected routes require authentication
router.get("/", authenticateToken, getInventory);

// Protected routes require authentication
router.post(
  "/",
  authenticateToken,
  auditMiddleware("CREATE", "inventory"),
  createAsset
);
router.post(
  "/batch",
  authenticateToken,
  auditMiddleware("CREATE", "inventory"),
  batchCreateAssets
);
router.put(
  "/:id",
  authenticateToken,
  auditMiddleware("UPDATE", "inventory"),
  updateAsset
);
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["Admin", "Custodian"]),
  auditMiddleware("DELETE", "inventory"),
  deleteAsset
);

// ✅ ADD THIS ROUTE
router.get("/statuses", getAssetStatuses);

// Asset Lifecycle Timeline View
router.get("/lifecycle-timeline", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { lab_id } = req.query;
    
    let query = `
      SELECT 
        asset_id,
        property_tag_no,
        serial_number,
        description,
        quantity,
        asset_remarks,
        current_age_years,
        current_age_months,
        current_age_days,
        timeline_position,
        lifecycle_stage,
        lifecycle_status,
        status_name,
        status_id,
        unit_name,
        unit_id,
        device_type_name,
        device_type_id,
        workstation_name,
        workstation_id,
        lab_name,
        lab_id,
        lab_location,
        asset_name,
        date_of_purchase,
        formatted_purchase_date,
        date_added,
        formatted_added_date,
        added_by_name,
        added_by_email,
        current_date,
        assignment_status,
        age_category,
        searchable_text
      FROM asset_lifecycle_timeline_view
    `;
    
    const params: any[] = [];
    
    // Add lab filter if specified (for custodians)
    if (lab_id) {
      query += " WHERE lab_id = ?";
      params.push(Number(lab_id));
    }
    
    query += " ORDER BY current_age_years DESC, lab_name, workstation_name";
    
    const results = await prisma.$queryRawUnsafe(query, ...params);
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching asset lifecycle timeline:", error);
    res.status(500).json({ error: "Failed to fetch asset lifecycle timeline" });
  }
});

// Asset Lifecycle Summary
router.get("/lifecycle-summary", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { lab_id } = req.query;
    
    let query = `
      SELECT 
        lifecycle_stage,
        lifecycle_status,
        COUNT(*) AS asset_count,
        COUNT(DISTINCT lab_id) AS lab_count,
        COUNT(DISTINCT workstation_id) AS workstation_count,
        AVG(current_age_years) AS avg_age_years,
        COUNT(CASE WHEN assignment_status = 'Assigned' THEN 1 END) AS assigned_count,
        COUNT(CASE WHEN assignment_status = 'Unassigned' THEN 1 END) AS unassigned_count
      FROM asset_lifecycle_timeline_view
    `;
    
    const params: any[] = [];
    
    // Add lab filter if specified (for custodians)
    if (lab_id) {
      query += " WHERE lab_id = ?";
      params.push(Number(lab_id));
    }
    
    query += " GROUP BY lifecycle_stage, lifecycle_status ORDER BY lifecycle_stage";
    
    const results = await prisma.$queryRawUnsafe(query, ...params);
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching asset lifecycle summary:", error);
    res.status(500).json({ error: "Failed to fetch asset lifecycle summary" });
  }
});

// Resources
router.get("/units", async (req: Request, res: Response) => {
  try {
    const { device_type_id } = req.query;
    const where = device_type_id
      ? { device_type_id: Number(device_type_id) }
      : {};
    const units = await prisma.units.findMany({ where });
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch units" });
  }
});

router.post(
  "/units",
  authenticateToken,
  requireRole(["Admin", "Custodian"]),
  auditMiddleware("CREATE", "units"),
  async (req: Request, res: Response) => {
    try {
      const { unit_name, device_type_id } = req.body;
      
      if (!unit_name || !device_type_id) {
        return res.status(400).json({ error: "Unit name and device type are required" });
      }

      // Check if unit already exists for this device type
      const existingUnit = await prisma.units.findFirst({
        where: {
          unit_name: unit_name.trim(),
          device_type_id: Number(device_type_id)
        }
      });

      if (existingUnit) {
        return res.status(400).json({ error: "Unit with this name already exists for this device type" });
      }

      const newUnit = await prisma.units.create({
        data: {
          unit_name: unit_name.trim(),
          device_type_id: Number(device_type_id)
        }
      });

      res.status(201).json(newUnit);
    } catch (error) {
      console.error("Error creating unit:", error);
      res.status(500).json({ error: "Failed to create unit" });
    }
  }
);

router.get("/device-types", async (req: Request, res: Response) => {
  try {
    const deviceTypes = await prisma.device_types.findMany();
    res.json(deviceTypes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch device types" });
  }
});

// ✅ NEW: Resolve workstation name to ID based on lab_id
router.get("/resolve-workstation", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { lab_id, workstation_name } = req.query;
    
    if (!lab_id || !workstation_name) {
      return res.status(400).json({ error: "lab_id and workstation_name are required" });
    }
    
    // Find workstation by name and lab_id
    const workstation = await prisma.workstations.findFirst({
      where: {
        workstation_name: String(workstation_name).trim(),
        lab_id: Number(lab_id)
      },
      select: {
        workstation_id: true
      }
    });
    
    if (!workstation) {
      return res.status(404).json({ 
        error: `Workstation "${workstation_name}" not found in Lab ${lab_id}` 
      });
    }
    
    res.json({ workstation_id: workstation.workstation_id });
  } catch (error) {
    console.error("Error resolving workstation:", error);
    res.status(500).json({ error: "Failed to resolve workstation" });
  }
});

export default router;
