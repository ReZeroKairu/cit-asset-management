import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ScheduleService } from "../services/maintenance/scheduleService";
import { PMCReportService } from "../services/maintenance/pmcReportService";
import { ServiceLogService } from "../services/maintenance/serviceLogService";
import { AnalyticsService } from "../services/maintenance/analyticsService";

const prisma = new PrismaClient();

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
    const workstationIdArray = String(workstation_ids).split(',').map(id => Number(id.trim)).filter(id => !isNaN(id));

    if (workstationIdArray.length === 0) {
      return res.status(400).json({ error: "Invalid workstation IDs provided" });
    }
    
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

// 3. GET Maintenance Services by Date (for reports)
export const getMaintenanceServicesByDate = async (req: Request, res: Response) => {
  try {
    console.log('🔍 GET MAINTENANCE SERVICES BY DATE - Request received');
    const { date, lab_id } = req.query;
    const user_id = req.user?.userId;
    const user_role = req.user?.role;
    const userLabId = req.user?.lab_id;

    console.log('📋 Request params:', { date, lab_id, user_id, user_role, userLabId });

    if (!date) {
      console.log('❌ Date is required');
      return res.status(400).json({ error: "Date is required" });
    }

    // Use provided lab_id or user's assigned lab
    const targetLabId = lab_id ? Number(lab_id) : userLabId;
    console.log('🎯 Target Lab ID:', targetLabId);

    // Fetch service logs for the date with ROUTINE service type
    // Include related PMC reports to get overall_remarks and workstation info
    const serviceLogs = await prisma.service_logs.findMany({
      where: {
        service_date: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`)
        },
        service_type: 'ROUTINE', // Only daily services
        ...(targetLabId && { pmc_reports: { lab_id: targetLabId } })
      },
      include: {
        pmc_reports: {
          include: {
            workstations: {
              select: { workstation_name: true }
            },
            pmc_report_procedures: {
              include: {
                procedures: {
                  select: { procedure_id: true, procedure_name: true, category: true }
                }
              }
            }
          }
        },
        users: {
          select: { full_name: true }
        },
        service_log_procedures: {
          include: {
            procedures: {
              select: { procedure_id: true, procedure_name: true, category: true }
            }
          }
        }
      },
      orderBy: { created_at: 'asc' } // chronological order (first created first)
    });

    // Get only the latest service per workstation
    const latestServicesMap = new Map();
    serviceLogs.forEach(log => {
      const wsId = log.pmc_reports?.workstation_id;
      // Always update to get the latest service (since we sorted by date asc, last one is latest)
      if (wsId) {
        latestServicesMap.set(wsId, log);
      }
    });

    const uniqueLatestServices = Array.from(latestServicesMap.values())
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // Sort by created_at ascending

    console.log('✅ Found service logs:', serviceLogs.length);
    console.log('✅ Latest services per workstation:', uniqueLatestServices.length);
    console.log('🔍 Sample service data:', uniqueLatestServices.slice(0, 1).map(s => ({
      log_id: s.log_id,
      has_service_log_procedures: !!s.service_log_procedures,
      service_log_procedures_count: s.service_log_procedures?.length || 0,
      has_pmc_report_procedures: !!s.pmc_reports?.pmc_report_procedures,
      pmc_report_procedures_count: s.pmc_reports?.pmc_report_procedures?.length || 0
    })));

    res.json({
      success: true,
      data: uniqueLatestServices
    });
  } catch (error) {
    console.error("❌ Error fetching maintenance services by date:", error);
    res.status(500).json({ error: "Failed to fetch maintenance services" });
  }
};
