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
            lab_id: true,
            lab_name: true,
            location: true,
          },
        },
        current_status: true,
        assets: {
          include: {
            details: true,
            units: true,
          },
        },
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
    const { workstation_name, lab_id, workstation_remarks, status_id } =
      req.body;

    if (!workstation_name) {
      return res.status(400).json({ error: "Workstation name is required" });
    }

    const newWorkstation = await prisma.workstations.create({
      data: {
        workstation_name,
        lab_id: lab_id ? Number(lab_id) : null,
        workstation_remarks: workstation_remarks || null,
        status_id: status_id ? Number(status_id) : 1, // Default to 1
      },
      include: {
        current_status: true,
      },
    });

    res.status(201).json(newWorkstation);
  } catch (error) {
    console.error("Error creating workstation:", error);
    res.status(500).json({ error: "Failed to create workstation" });
  }
};

// 3. GET WORKSTATION DETAILS (By ID or Name)
export const getWorkstationDetails = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    // ✅ FIX: Explicitly convert to string to satisfy TypeScript
    // This handles the "string | string[]" error
    const searchParam = String(name);

    const isId = !isNaN(Number(searchParam));

    const workstation = await prisma.workstations.findFirst({
      where: isId
        ? { workstation_id: Number(searchParam) }
        : { workstation_name: searchParam },
      include: {
        laboratory: {
          select: {
            lab_id: true,
            lab_name: true,
            location: true,
          },
        },
        current_status: true,
        assets: {
          include: {
            details: true,
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

// 4. UPDATE WORKSTATION (FIXED TS ERROR)
export const updateWorkstation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workstationId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);

    const { workstation_name, lab_id, workstation_remarks, status_id } =
      req.body;

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

    // ✅ FIX: Construct data object dynamically to avoid Type 'number | undefined' error
    const updateData: any = {
      workstation_name,
      workstation_remarks, // Pass as is; Prisma handles undefined by ignoring it
    };

    // Only set status_id if it explicitly exists (truthy or 0)
    if (status_id) {
      updateData.status_id = Number(status_id);
    }

    // Handle Laboratory Relation
    if (lab_id) {
      updateData.lab_id = Number(lab_id);
    }

    // Update the workstation
    const updatedWorkstation = await prisma.workstations.update({
      where: { workstation_id: workstationId },
      data: updateData,
      include: {
        current_status: true,
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

    const existingWorkstation = await prisma.workstations.findUnique({
      where: { workstation_id: workstationId },
    });

    if (!existingWorkstation) {
      return res.status(404).json({ error: "Workstation not found" });
    }

    // ✅ FIX: Use a transaction to handle all foreign key constraints before deleting
    await prisma.$transaction(async (tx) => {
      // 1. Unassign all assets linked to this workstation (moves them to Unassigned Assets)
      await tx.inventory_assets.updateMany({
        where: { workstation_id: workstationId },
        data: { workstation_id: null },
      });

      // 2. Delete related Daily Report items for this workstation
      await tx.report_workstation_items.deleteMany({
        where: { workstation_id: workstationId },
      });

      // 3. Delete related PMC Reports for this workstation
      // (This will also automatically delete pmc_report_procedures due to the Cascade rule in your schema)
      await tx.pmc_reports.deleteMany({
        where: { workstation_id: workstationId },
      });

      // 4. Now that dependencies are cleared, delete the workstation itself
      await tx.workstations.delete({
        where: { workstation_id: workstationId },
      });
    });

    res.json({ message: "Workstation and its relations deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting workstation:", error);
    res.status(500).json({
      error: "Failed to delete workstation",
      details: error.message,
    });
  }
};

// 6. BATCH CREATE WORKSTATIONS
export const batchCreateWorkstations = async (req: Request, res: Response) => {
  try {
    const { workstations } = req.body;

    if (!Array.isArray(workstations) || workstations.length === 0) {
      return res.status(400).json({
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

    // Check for duplicates
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
      },
    });

    if (existingWorkstations.length > 0) {
      const duplicates = existingWorkstations.map(
        (ws) => `"${ws.workstation_name}" in Lab ID: ${ws.lab_id}`,
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
        workstation_remarks: ws.workstation_remarks || null,
        status_id: ws.status_id ? Number(ws.status_id) : 1,
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

// 7. GET WORKSTATIONS BY LAB (For Maintenance Page)
export const getWorkstationsByLab = async (req: Request, res: Response) => {
  const { labId } = req.params;

  try {
    const workstations = await prisma.workstations.findMany({
      where: {
        lab_id: Number(labId),
      },
      include: {
        current_status: true, // ✅ Fetches "Functional", "For Repair", etc.
        assets: true,
      },
      orderBy: {
        workstation_name: "asc",
      },
    });

    res.json(workstations);
  } catch (error) {
    console.error("Error fetching lab workstations:", error);
    res.status(500).json({ error: "Failed to fetch workstations" });
  }
};
