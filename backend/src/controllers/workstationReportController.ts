import { Request, Response } from "express";
import * as WorkstationReportService from "../services/workstationReportService";

export const getLabWorkstationsForReport = async (
  req: Request,
  res: Response,
) => {
  try {
    const labId = parseInt(req.query.lab_id as string);
    if (isNaN(labId))
      return res.status(400).json({ error: "Lab ID is required" });

    const workstations =
      await WorkstationReportService.getLabWorkstationsForReport(labId);
    res.json(workstations);
  } catch (error: any) {
    console.error("Error fetching lab workstations:", error);
    res.status(500).json({ error: "Failed to fetch workstations" });
  }
};

export const saveWorkstationChecklist = async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.body.reportId);
    if (isNaN(reportId))
      return res.status(400).json({ error: "Report ID is required" });

    const result = await WorkstationReportService.saveWorkstationChecklist(
      reportId,
      req.body.workstations,
    );
    res.json({
      message: `Successfully saved ${result.length} workstation checks`,
      items: result,
    });
  } catch (error: any) {
    console.error("Error saving workstation checklist:", error);
    if (error.message.includes("VALIDATION"))
      return res.status(400).json({ error: error.message });
    res.status(500).json({ error: "Failed to save workstation checklist" });
  }
};

export const getWorkstationChecklist = async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.reportId as string);
    if (isNaN(reportId))
      return res.status(400).json({ error: "Report ID is required" });

    const items =
      await WorkstationReportService.getWorkstationChecklist(reportId);
    res.json(items);
  } catch (error: any) {
    console.error("Error fetching workstation checklist:", error);
    res.status(500).json({ error: "Failed to fetch workstation checklist" });
  }
};
