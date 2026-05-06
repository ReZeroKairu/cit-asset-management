import { Request, Response } from "express";
import * as ReportService from "../services/reportService";

export const getReportData = async (req: Request, res: Response) => {
  try {
    const filters = {
      lab_id: req.query.lab_id
        ? parseInt(req.query.lab_id as string)
        : undefined,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    const data = await ReportService.getReportData(filters);
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching report data:", error);
    res.status(500).json({ error: "Failed to fetch report data" });
  }
};
