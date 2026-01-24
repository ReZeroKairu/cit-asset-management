// backend/src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const port = 3000;

app.use(cors());
app.use(express.json());

// 1. GET all Laboratories (e.g., for a dropdown menu)
app.get("/laboratories", async (req: Request, res: Response) => {
  try {
    const labs = await prisma.laboratories.findMany(); // Matches your SQL table name
    res.json(labs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch labs" });
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
