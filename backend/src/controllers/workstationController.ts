import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET ALL (For Dropdowns)
export const getAllWorkstations = async (req: Request, res: Response) => {
  try {
    const workstations = await prisma.workstations.findMany({
      include: { laboratory: true },
    });
    res.json(workstations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch workstations" });
  }
};

// 2. CREATE (Add New)
export const createWorkstation = async (req: Request, res: Response) => {
  try {
    const { workstation_name, lab_id } = req.body;

    // Check duplicate name
    const existing = await prisma.workstations.findUnique({
      where: { workstation_name },
    });
    if (existing)
      return res.status(400).json({ error: "Workstation name already exists" });

    const newWorkstation = await prisma.workstations.create({
      data: {
        workstation_name,
        laboratory: { connect: { lab_id: Number(lab_id) } },
      },
    });

    res.status(201).json(newWorkstation);
  } catch (error) {
    console.error("Create WS Error:", error);
    res.status(500).json({ error: "Failed to create workstation" });
  }
};

// 3. GET DETAILS (For Viewing specific parts later)
export const getWorkstationDetails = async (req: Request, res: Response) => {
  // --- THE FIX IS HERE ---
  // We use "as string" to tell TypeScript "Trust me, this is a string"
  const name = req.params.name as string;
  // -----------------------

  try {
    const workstation = await prisma.workstations.findUnique({
      where: { workstation_name: name },
      include: {
        assets: true,
        laboratory: true,
      },
    });

    if (!workstation) {
      // Add return here to stop execution if not found
      res.status(404).json({ error: "Workstation not found" });
      return;
    }

    res.json(workstation);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch details" });
  }
};
