import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get workstations for a specific lab (for daily report checkboxes)
export const getLabWorkstationsForReport = async (req: Request, res: Response) => {
  try {
    const { lab_id } = req.query;
    const { reportId } = req.query; // Optional: if editing existing report

    if (!lab_id) {
      return res.status(400).json({ error: "Lab ID is required" });
    }

    // Get all workstations for the lab
    const workstations = await prisma.workstations.findMany({
      where: { lab_id: Number(lab_id) },
      include: {
        current_status: true,
      },
      orderBy: { workstation_name: 'asc' }
    });

    // Format response for frontend
    const formattedWorkstations = workstations.map((ws) => ({
      workstation_id: ws.workstation_id,
      workstation_name: ws.workstation_name,
      workstation_remarks: ws.workstation_remarks ?? null,
      current_status: ws.current_status ?? null,
      status: "Working",
      remarks: null,
      checked: false,
    }));

    res.json(formattedWorkstations);
  } catch (error) {
    console.error("Error fetching lab workstations:", error);
    res.status(500).json({ error: "Failed to fetch workstations" });
  }
};

// POST: Save workstation checklist for a daily report
export const saveWorkstationChecklist = async (req: Request, res: Response) => {
  try {
    const { reportId, workstations } = req.body;

    if (!reportId || !Array.isArray(workstations)) {
      return res.status(400).json({ error: "Report ID and workstations array are required" });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing workstation items for this report
      await tx.report_workstation_items.deleteMany({
        where: { report_id: Number(reportId) }
      });

      // Insert new workstation items
      const savedItems = await Promise.all(
        workstations.map((ws: any) => 
          tx.report_workstation_items.create({
            data: {
              report_id: Number(reportId),
              workstation_id: ws.workstation_id,
              status: ws.status || 'Working',
              remarks: ws.remarks || null
            }
          })
        )
      );

      return savedItems;
    });

    res.json({
      message: `Successfully saved ${result.length} workstation checks`,
      items: result
    });
  } catch (error) {
    console.error("Error saving workstation checklist:", error);
    res.status(500).json({ error: "Failed to save workstation checklist" });
  }
};

// GET: Get workstation checklist for a specific daily report
export const getWorkstationChecklist = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({ error: "Report ID is required" });
    }

    const checklistItems = await prisma.report_workstation_items.findMany({
      where: { report_id: Number(reportId) }
    });

    res.json(checklistItems);
  } catch (error) {
    console.error("Error fetching workstation checklist:", error);
    res.status(500).json({ error: "Failed to fetch workstation checklist" });
  }
};
