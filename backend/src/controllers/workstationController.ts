import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET ALL WORKSTATIONS (with assigned assets)
export const getAllWorkstations = async (req: Request, res: Response) => {
  try {
    const workstations = await prisma.workstations.findMany({
      include: {
        laboratory: {
          select: {
            lab_name: true,
            location: true,
          },
        },
        assets: {
          select: {
            asset_id: true,
            item_name: true,
            property_tag_no: true,
            serial_number: true,
            units: {
              select: {
                unit_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(workstations);
  } catch (error) {
    console.error("Error fetching workstations:", error);
    res.status(500).json({ error: "Failed to fetch workstations" });
  }
};

// 2. CREATE WORKSTATION
export const createWorkstation = async (req: Request, res: Response) => {
  try {
    const { workstation_name, lab_id } = req.body;

    if (!workstation_name) {
      return res.status(400).json({ error: "Workstation name is required" });
    }

    const newWorkstation = await prisma.workstations.create({
      data: {
        workstation_name,
        lab_id: lab_id ? Number(lab_id) : null,
      },
      include: {
        laboratory: true,
      },
    });

    res.status(201).json(newWorkstation);
  } catch (error) {
    console.error("Error creating workstation:", error);
    res.status(500).json({ error: "Failed to create workstation" });
  }
};

// 3. GET WORKSTATION DETAILS
export const getWorkstationDetails = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const workstationName = Array.isArray(name) ? name[0] : name;
    
    const workstation = await prisma.workstations.findFirst({
      where: {
        workstation_name: workstationName,
      },
      include: {
        laboratory: true,
        assets: {
          include: {
            units: true,
          },
        },
      },
    });

    if (!workstation) {
      return res.status(404).json({ error: "Workstation not found" });
    }

    res.json(workstation);
  } catch (error) {
    console.error("Error fetching workstation details:", error);
    res.status(500).json({ error: "Failed to fetch workstation details" });
  }
};

// 4. UPDATE WORKSTATION
export const updateWorkstation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workstationId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
    
    const { workstation_name, lab_id } = req.body;

    if (!workstationId) {
      return res.status(400).json({ error: "Workstation ID is required" });
    }

    // Check if workstation exists
    const existingWorkstation = await prisma.workstations.findUnique({
      where: { workstation_id: workstationId }
    });

    if (!existingWorkstation) {
      return res.status(404).json({ error: "Workstation not found" });
    }

    // Update the workstation
    const updatedWorkstation = await prisma.workstations.update({
      where: { workstation_id: workstationId },
      data: {
        workstation_name,
        laboratory: lab_id ? { connect: { lab_id: Number(lab_id) } } : { disconnect: true },
      },
      include: {
        laboratory: true,
      },
    });

    res.json(updatedWorkstation);
  } catch (error) {
    console.error("Error updating workstation:", error);
    res.status(500).json({ 
      error: "Failed to update workstation",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// 5. DELETE WORKSTATION
export const deleteWorkstation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workstationId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);

    if (!workstationId) {
      return res.status(400).json({ error: "Workstation ID is required" });
    }

    // Check if workstation exists
    const existingWorkstation = await prisma.workstations.findUnique({
      where: { workstation_id: workstationId }
    });

    if (!existingWorkstation) {
      return res.status(404).json({ error: "Workstation not found" });
    }

    // Delete the workstation
    await prisma.workstations.delete({
      where: { workstation_id: workstationId }
    });

    res.json({ message: "Workstation deleted successfully" });
  } catch (error) {
    console.error("Error deleting workstation:", error);
    res.status(500).json({ error: "Failed to delete workstation" });
  }
};
