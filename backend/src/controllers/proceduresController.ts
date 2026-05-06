// src/controllers/proceduresController.ts
import { Request, Response } from "express";
import * as ProceduresService from "../services/proceduresService";

export const getAllProcedures = async (req: Request, res: Response) => {
  try {
    const procedures = await ProceduresService.getAllProcedures();
    res.json(procedures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch procedures" });
  }
};

export const getReportProcedures = async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.reportId as string);
    if (isNaN(reportId))
      return res.status(400).json({ error: "Report ID is required" });

    const procedures = await ProceduresService.getReportProcedures(reportId);
    res.json(procedures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report procedures" });
  }
};

export const saveReportProcedures = async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.body.reportId);
    if (isNaN(reportId))
      return res.status(400).json({ error: "Report ID is required" });

    const result = await ProceduresService.saveReportProcedures(
      reportId,
      req.body.procedures,
    );
    res.json({
      message: `Successfully saved ${result.length} procedures`,
      procedures: result,
    });
  } catch (error: any) {
    if (error.message.includes("VALIDATION"))
      return res.status(400).json({ error: error.message });
    res.status(500).json({ error: "Failed to save report procedures" });
  }
};

export const getWorkstationProcedures = async (req: Request, res: Response) => {
  try {
    const procedures = await ProceduresService.getWorkstationProcedures();
    res.json(procedures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch workstation procedures" });
  }
};
