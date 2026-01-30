//backend/src/controllers/workstationController.ts
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
          include: {
            details: {
              select: {
                property_tag_no: true,
                serial_number: true,
                description: true,
              },
            },
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
      where: { workstation_id: workstationId },
    });

    if (!existingWorkstation) {
      return res.status(404).json({ error: "Workstation not found" });
    }

    // Update the workstation
    const updatedWorkstation = await prisma.workstations.update({
      where: { workstation_id: workstationId },
      data: {
        workstation_name,
        laboratory: lab_id
          ? { connect: { lab_id: Number(lab_id) } }
          : { disconnect: true },
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
      details: error instanceof Error ? error.message : "Unknown error",
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
      where: { workstation_id: workstationId },
    });

    if (!existingWorkstation) {
      return res.status(404).json({ error: "Workstation not found" });
    }

    // Delete the workstation
    await prisma.workstations.delete({
      where: { workstation_id: workstationId },
    });

    res.json({ message: "Workstation deleted successfully" });
  } catch (error) {
    console.error("Error deleting workstation:", error);
    res.status(500).json({ error: "Failed to delete workstation" });
  }
};

export const batchCreateWorkstations = async (req: Request, res: Response) => {
  try {
    const { workstations } = req.body;

    if (!Array.isArray(workstations) || workstations.length === 0) {
      return res
        .status(400)
        .json({
          error: "Invalid data format. Expected an array of workstations.",
        });
    }

    // Validate input data
    const validationErrors: string[] = [];
    for (const [index, ws] of workstations.entries()) {
      if (!ws.workstation_name || typeof ws.workstation_name !== "string") {
        validationErrors.push(
          `Workstation ${index + 1}: Missing or invalid name`,
        );
      }
      if (!ws.lab_id || isNaN(Number(ws.lab_id))) {
        validationErrors.push(
          `Workstation ${index + 1}: Missing or invalid lab_id`,
        );
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Check if labs exist
    const labIds = [...new Set(workstations.map((ws) => Number(ws.lab_id)))];
    const existingLabs = await prisma.laboratories.findMany({
      where: { lab_id: { in: labIds } },
      select: { lab_id: true, lab_name: true },
    });

    const missingLabIds = labIds.filter(
      (id) => !existingLabs.find((lab) => lab.lab_id === id),
    );
    if (missingLabIds.length > 0) {
      return res.status(400).json({
        error: "Invalid laboratory IDs",
        details: `Lab IDs not found: ${missingLabIds.join(", ")}`,
      });
    }

    // Check for existing workstations in the same labs
    const existingWorkstations = await prisma.workstations.findMany({
      where: {
        AND: [
          {
            OR: workstations.map((ws) => ({
              workstation_name: ws.workstation_name.trim(),
              lab_id: Number(ws.lab_id),
            })),
          },
        ],
      },
      select: {
        workstation_name: true,
        lab_id: true,
        laboratory: {
          select: { lab_name: true },
        },
      },
    });

    if (existingWorkstations.length > 0) {
      const duplicates = existingWorkstations.map(
        (ws) =>
          `"${ws.workstation_name}" in ${ws.laboratory?.lab_name || `Lab ID: ${ws.lab_id}`}`,
      );
      return res.status(409).json({
        error: "Duplicate workstation names found",
        details: `These workstations already exist: ${duplicates.join(", ")}`,
      });
    }

    // Create workstations
    const result = await prisma.workstations.createMany({
      data: workstations.map((ws: any) => ({
        workstation_name: ws.workstation_name.trim(),
        lab_id: Number(ws.lab_id),
      })),
    });

    res.status(201).json({
      message: `Successfully created ${result.count} workstation(s)`,
      count: result.count,
      created: result.count,
    });
  } catch (error: any) {
    console.error("Batch create error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Duplicate workstation names detected",
        details:
          "One or more workstation names already exist in the specified laboratories",
      });
    }

    res.status(500).json({
      error: "Failed to create workstations",
      details: error.message,
    });
  }
};
