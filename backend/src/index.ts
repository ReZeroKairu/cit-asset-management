// backend/src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { getInventory, createAsset } from "./controllers/inventoryController";
import { login } from "./controllers/authController";
import { getOrganizationData, createUser } from "./controllers/userController";
import {
  getAllWorkstations,
  createWorkstation,
  getWorkstationDetails,
} from "./controllers/workstationController";

const app = express();
const prisma = new PrismaClient();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post("/login", login);

app.get("/organization-data", getOrganizationData); // For dropdowns
app.post("/users", createUser); // For form submission

app.get("/inventory", getInventory);
app.post("/inventory", createAsset);

// Workstation Routes
app.get("/workstations", getAllWorkstations); // For Dropdowns
app.post("/workstations", createWorkstation); // For "Add Workstation" Modal
app.get("/workstations/:name", getWorkstationDetails); // For viewing details

// 1. GET all Laboratories (e.g., for a dropdown menu)
app.get("/laboratories", async (req: Request, res: Response) => {
  try {
    const labs = await prisma.laboratories.findMany(); // Matches your SQL table name
    res.json(labs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch labs" });
  }
});

app.get("/units", async (req: Request, res: Response) => {
  try {
    const units = await prisma.units.findMany();
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch units" });
  }
});

// 2. GET all Standard Tasks (The Checklist)
app.get("/tasks", async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.standard_tasks.findMany();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
