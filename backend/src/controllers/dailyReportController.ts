import { Request, Response } from "express";
import * as DailyReportService from "../services/dailyReportService";

export const getArchivedReports = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const filters = {
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await DailyReportService.getArchivedReports(
      req.user.role,
      req.user.lab_id,
      filters,
    );
    res.json(result);
  } catch (error: any) {
    console.error("Error fetching archived reports:", error);
    res.status(500).json({
      error: "Failed to fetch archived reports",
      details: error.message,
    });
  }
};

export const getAllDailyReports = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const filters = {
      lab_id: req.query.lab_id
        ? parseInt(req.query.lab_id as string)
        : undefined,
      user_id: req.query.user_id
        ? parseInt(req.query.user_id as string)
        : undefined,
      status: req.query.status as string,
      exclude_status: req.query.exclude_status as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    const reports = await DailyReportService.getAllDailyReports(
      req.user.role,
      req.user.lab_id,
      filters,
    );
    res.json({ success: true, data: reports });
  } catch (error: any) {
    console.error("Error fetching daily reports:", error);
    res.status(error.message.includes("FORBIDDEN") ? 403 : 500).json({
      error: error.message || "Failed to fetch daily reports",
    });
  }
};

export const getDailyReportById = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const reportId = parseInt(req.params.id as string);
    const report = await DailyReportService.getDailyReportById(
      reportId,
      req.user.role,
      req.user.lab_id,
    );

    res.json(report);
  } catch (error: any) {
    console.error("Error fetching daily report:", error);
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ error: "Daily report not found" });
    if (error.message.includes("FORBIDDEN"))
      return res.status(403).json({ error: "Access denied" });
    res.status(500).json({ error: "Failed to fetch daily report" });
  }
};

export const createDailyReport = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const newReport = await DailyReportService.createDailyReport(
      req.user.userId,
      req.user.role,
      req.body,
    );
    res.status(201).json(newReport);
  } catch (error: any) {
    console.error("Error creating daily report:", error);
    res
      .status(
        error.message.includes("FORBIDDEN") || error.message.includes("Maximum")
          ? 403
          : 500,
      )
      .json({
        error: error.message || "Failed to create daily report",
      });
  }
};

export const updateDailyReport = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const reportId = parseInt(req.params.id as string);
    const updatedReport = await DailyReportService.updateDailyReport(
      reportId,
      req.user.userId,
      req.user.role,
      req.body,
    );

    res.json(updatedReport);
  } catch (error: any) {
    console.error("Error updating daily report:", error);
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ error: "Daily report not found" });
    if (error.message.includes("FORBIDDEN"))
      return res.status(403).json({ error: error.message });
    if (error.message.includes("Invalid status"))
      return res.status(400).json({ error: error.message });

    res.status(500).json({ error: "Failed to update daily report" });
  }
};

export const deleteDailyReport = async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id as string);
    const result = await DailyReportService.deleteDailyReport(reportId);
    res.json(result);
  } catch (error: any) {
    console.error("Error deleting daily report:", error);
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ error: "Daily report not found" });
    res.status(500).json({ error: "Failed to delete daily report" });
  }
};

export const getMyDailyReports = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const filters = {
      status: req.query.status as string,
      exclude_status: (req.query.exclude_status as string) || "Approved", // Exclude approved by default for "My Reports"
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    // We can reuse the getAllDailyReports service function because it already filters to the user's lab
    // when they are not an Admin.
    const reports = await DailyReportService.getAllDailyReports(
      req.user.role,
      req.user.lab_id,
      filters,
    );

    res.json({ success: true, data: reports });
  } catch (error: any) {
    console.error("Error fetching user daily reports:", error);
    res.status(500).json({ error: "Failed to fetch daily reports" });
  }
};
