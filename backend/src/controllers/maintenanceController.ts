import { Request, Response } from "express";
import { ScheduleService } from "../services/maintenance/scheduleService";
import { PMCReportService } from "../services/maintenance/pmcReportService";
import { ServiceLogService } from "../services/maintenance/serviceLogService";
import { AnalyticsService } from "../services/maintenance/analyticsService";

// SCHEDULE MANAGEMENT CONTROLLERS

// 1. GET all schedules for a lab and fiscal year
export const getLabSchedules = async (req: Request, res: Response) => {
  try {
    const { lab_id, fiscal_year } = req.query;

    if (!lab_id || !fiscal_year) {
      return res.status(400).json({ error: "Lab ID and Fiscal Year are required" });
    }

    const schedules = await ScheduleService.getLabSchedules(
      Number(lab_id), 
      String(fiscal_year)
    );

    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
};

// 2. CREATE or UPDATE schedules for a lab
export const upsertSchedules = async (req: Request, res: Response) => {
  try {
    const { lab_id, fiscal_year, schedules } = req.body;

    if (!lab_id || !fiscal_year || !schedules) {
      return res.status(400).json({ error: "Lab ID, Fiscal Year, and Schedules are required" });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const result = await ScheduleService.upsertSchedules(
      Number(lab_id),
      String(fiscal_year),
      schedules
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save schedules" });
  }
};

// 3. DELETE all schedules for a lab and fiscal year
export const deleteLabSchedules = async (req: Request, res: Response) => {
  try {
    const { lab_id, fiscal_year } = req.query;

    if (!lab_id || !fiscal_year) {
      return res.status(400).json({ error: "Lab ID and Fiscal Year are required" });
    }

    const result = await ScheduleService.deleteLabSchedules(
      Number(lab_id),
      String(fiscal_year)
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete schedules" });
  }
};

// PMC REPORT MANAGEMENT CONTROLLERS

// 1. GET Reports for a Lab & Quarter
export const getLabPMCReports = async (req: Request, res: Response) => {
  try {
    const { lab_id, quarter } = req.query;

    if (!lab_id || !quarter) {
      return res.status(400).json({ error: "Lab ID and Quarter are required" });
    }

    const reports = await PMCReportService.getLabPMCReports(
      Number(lab_id),
      String(quarter)
    );

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

// 2. GET Single Report Details
export const getPMCReportDetail = async (req: Request, res: Response) => {
  try {
    const { workstation_id, quarter } = req.query;

    if (!workstation_id || !quarter) {
      return res.status(400).json({ error: "Workstation ID and Quarter are required" });
    }

    const report = await PMCReportService.getPMCReportDetail(
      Number(workstation_id),
      String(quarter)
    );

    if (!report) {
      return res.status(404).json({ 
        error: "No PMC report found for this workstation and quarter",
        details: {
          workstation_id: Number(workstation_id),
          quarter: String(quarter),
          message: "Please create a PMC report for this workstation and quarter first"
        }
      });
    }

    res.json(report);
  } catch (error: any) {
    console.error("❌ GET PMC REPORT DETAIL - Error:", error);
    
    res.status(500).json({ 
      error: error.message || "Failed to fetch report detail",
      details: error.stack 
    });
  }
};

// 3. CREATE OR UPDATE A Report
export const createPMCReport = async (req: Request, res: Response) => {
  try {
    const {
      lab_id,
      workstation_id,
      report_date,
      quarter,
      workstation_status,
      overall_remarks,
      software_name,
      software_status,
      connectivity_type,
      connectivity_type_status,
      connectivity_speed,
      connectivity_speed_status,
      procedure_ids,
      service_type = "ROUTINE",
      asset_actions = [],
    } = req.body;

    const user_id = (req as any).user?.userId;
    if (!user_id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const result = await PMCReportService.createPMCReport({
      lab_id: Number(lab_id),
      workstation_id: Number(workstation_id),
      report_date,
      quarter,
      workstation_status,
      overall_remarks,
      software_name,
      software_status,
      connectivity_type,
      connectivity_type_status,
      connectivity_speed,
      connectivity_speed_status,
      procedure_ids,
      service_type,
      asset_actions,
      user_id: Number(user_id),
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Create PMC Error:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
};

// SERVICE LOG MANAGEMENT CONTROLLERS

// 1. GET Service History for a Workstation
export const getServiceHistory = async (req: Request, res: Response) => {
  try {
    const { workstation_id, quarter } = req.query;

    if (!workstation_id) {
      return res.status(400).json({ error: "Workstation ID is required" });
    }

    const serviceLogs = await ServiceLogService.getServiceHistory(
      Number(workstation_id),
      quarter ? String(quarter) : undefined
    );

    res.json(serviceLogs);
  } catch (error) {
    console.error("Get Service History Error:", error);
    res.status(500).json({ error: "Failed to fetch service history" });
  }
};

// 2. CREATE Repair/Replacement Log
export const createRepairLog = async (req: Request, res: Response) => {
  try {
    const {
      workstation_id,
      quarter,
      lab_id,
      service_date,
      service_type,
      remarks,
      asset_actions = [],
    } = req.body;

    const user_id = (req as any).user?.userId;
    if (!user_id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!workstation_id || !quarter) {
      return res
        .status(400)
        .json({ error: "Workstation ID and Quarter are required" });
    }

    const result = await ServiceLogService.createRepairLog({
      workstation_id: Number(workstation_id),
      quarter: String(quarter),
      lab_id: Number(lab_id),
      service_date,
      service_type,
      remarks,
      asset_actions,
      user_id: Number(user_id),
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Create Repair Log Error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create repair log" });
  }
};

// ANALYTICS CONTROLLERS

// 1. GET Preventive Maintenance Analytics for Dashboard
export const getMaintenanceAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    
    const analytics = await AnalyticsService.getMaintenanceAnalytics(
      userId ? Number(userId) : undefined,
      userRole
    );
    
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching maintenance analytics:", error);
    res.status(500).json({ message: "Failed to fetch maintenance analytics" });
  }
};

// 2. GET Multiple PMC Reports for Workstations (Batch endpoint)
export const getWorkstationPMCReportsBatch = async (req: Request, res: Response) => {
  try {
    const { workstation_ids, quarter } = req.query;

    if (!workstation_ids || !quarter) {
      return res.status(400).json({ error: "Workstation IDs and Quarter are required" });
    }

    // Parse workstation_ids from comma-separated string
    const workstationIdArray = String(workstation_ids).split(',').map(id => Number(id.trim()));
    
    const reports = await PMCReportService.getWorkstationPMCReportsBatch(
      workstationIdArray,
      String(quarter)
    );

    res.json(reports);
  } catch (error: any) {
    console.error("❌ GET PMC REPORTS BATCH - Error:", error);
    
    res.status(500).json({ 
      error: error.message || "Failed to fetch batch PMC reports",
      details: error.stack 
    });
  }
};
