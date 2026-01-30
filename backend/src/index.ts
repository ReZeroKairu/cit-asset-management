// backend/src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { getInventory, createAsset, deleteAsset, updateAsset, batchCreateAssets } from "./controllers/inventoryController";
import { login } from "./controllers/authController";
import { getOrganizationData, createUser, getUserAssignedLab, getAllUsersWithAssignments, assignUserToLab } from "./controllers/userController";
import {
  getAllWorkstations,
  createWorkstation,
  getWorkstationDetails,
  updateWorkstation,
  deleteWorkstation,
  batchCreateWorkstations,
} from "./controllers/workstationController";
import {
  getAllDailyReports,
  getDailyReportById,
  createDailyReport,
  updateDailyReport,
  deleteDailyReport,
  getMyDailyReports
} from "./controllers/dailyReportController";
import { getLaboratories, createLaboratory, updateLaboratory, deleteLaboratory } from "./controllers/labController";
import { authenticateToken, requireRole } from "./middleware/auth";

const app = express();
const prisma = new PrismaClient();
const port = 3000;

app.use(cors());
app.use(express.json());

// Public routes (no authentication required)
app.post("/login", login);

// Protected routes (authentication required)
app.get("/organization-data", authenticateToken, getOrganizationData);
app.get("/users/assigned-lab", authenticateToken, getUserAssignedLab);
app.get("/users/assignments", authenticateToken, requireRole(["Admin"]), getAllUsersWithAssignments);
app.put("/users/assign-lab", authenticateToken, requireRole(["Admin"]), assignUserToLab);
app.post("/users", authenticateToken, requireRole(["Admin"]), createUser);

app.get("/inventory", authenticateToken, getInventory);
app.post("/inventory", authenticateToken, createAsset);
app.post("/inventory/batch", authenticateToken, batchCreateAssets);
app.put("/inventory/:id", authenticateToken, updateAsset);
app.delete("/inventory/:id", authenticateToken, deleteAsset);

// Workstation Routes
app.get("/workstations", authenticateToken, getAllWorkstations);
app.post("/workstations", authenticateToken, createWorkstation);
app.post("/workstations/batch", authenticateToken, batchCreateWorkstations);
app.get("/workstations/:name", authenticateToken, getWorkstationDetails);
app.put("/workstations/:id", authenticateToken, updateWorkstation);
app.delete("/workstations/:id", authenticateToken, deleteWorkstation);

// Laboratory Routes
app.get("/laboratories", authenticateToken, getLaboratories);
app.post("/laboratories", authenticateToken, requireRole(["Admin"]), createLaboratory);
app.put("/laboratories/:id", authenticateToken, requireRole(["Admin"]), updateLaboratory);
app.delete("/laboratories/:id", authenticateToken, requireRole(["Admin"]), deleteLaboratory);

app.get("/units", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { device_type_id } = req.query;
    
    let units;
    if (device_type_id) {
      // Filter units by device type
      units = await prisma.units.findMany({
        where: {
          device_type_id: Number(device_type_id)
        }
      });
    } else {
      // Get all units
      units = await prisma.units.findMany();
    }
    
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch units" });
  }
});

app.get("/device-types", authenticateToken, async (req: Request, res: Response) => {
  try {
    const deviceTypes = await prisma.device_types.findMany();
    res.json(deviceTypes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch device types" });
  }
});

// 2. GET all Standard Tasks
app.get("/tasks", authenticateToken, async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.standard_tasks.findMany();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Daily Report Routes
app.get("/daily-reports", authenticateToken, getAllDailyReports); // Admin: view all reports
app.get("/daily-reports/my", authenticateToken, getMyDailyReports); // User: view own reports
app.get("/daily-reports/:id", authenticateToken, getDailyReportById); // Get single report
app.post("/daily-reports", authenticateToken, createDailyReport); // Create new report
app.put("/daily-reports/:id", authenticateToken, updateDailyReport); // Update report
app.delete("/daily-reports/:id", authenticateToken, requireRole(["Admin"]), deleteDailyReport); // Delete report (Admin only)

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
