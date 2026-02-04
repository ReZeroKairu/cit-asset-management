//backend/src/controllers/dailyReportController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET archived daily reports (approved reports only)
export const getArchivedReports = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, page = 1, limit = 10 } = req.query;
    
    // Get user info from authentication
    const authenticatedUserId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "User authentication required" });
    }
    
    // Fetch user's lab assignment from database
    const user = await prisma.users.findUnique({
      where: { user_id: authenticatedUserId },
      select: { lab_id: true }
    });
    
    const userLabId = user?.lab_id;
    
    const where: any = {
      status: 'Approved' // Only approved reports
    };
    
    // Role-based filtering
    if (userRole === 'Custodian') {
      // Custodians can only see reports from their assigned lab
      where.lab_id = userLabId;
    }
    // Admin can see all approved reports
    
    if (start_date && end_date) {
      const startDate = String(Array.isArray(start_date) ? start_date[0] : start_date) as string;
      const endDate = String(Array.isArray(end_date) ? end_date[0] : end_date) as string;
      where.report_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Parse pagination parameters
    const pageStr = Array.isArray(page) ? page[0] : page;
    const limitStr = Array.isArray(limit) ? limit[0] : limit;
    const pageNum = parseInt(String(pageStr || '1'));
    const limitNum = parseInt(String(limitStr || '10'));
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await prisma.daily_reports.count({ where });

    // Get paginated reports
    const reports = await prisma.daily_reports.findMany({
      where,
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limitNum
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    res.json({
      reports,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    console.error("Error fetching archived reports:", error);
    res.status(500).json({ error: "Failed to fetch archived reports" });
  }
};

// GET all daily reports (with filtering options)
export const getAllDailyReports = async (req: Request, res: Response) => {
  try {
    const { lab_id, user_id, status, start_date, end_date, exclude_status } = req.query;
    
    // Get user info from authentication
    const authenticatedUserId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "User authentication required" });
    }
    
    // Fetch user's lab assignment from database
    const user = await prisma.users.findUnique({
      where: { user_id: authenticatedUserId },
      select: { lab_id: true }
    });
    
    const userLabId = user?.lab_id;
    
    const where: any = {};
    
    // Role-based filtering
    if (userRole === 'Admin') {
      // Admin can see all reports, can apply additional filters
      if (lab_id) where.lab_id = parseInt(lab_id as string);
      if (user_id) where.user_id = parseInt(user_id as string);
    } else {
      // Custodians can only see reports from their assigned lab
      where.lab_id = userLabId;
      
      // Additional filtering for custodians (only if they match their own lab)
      if (lab_id && parseInt(lab_id as string) !== userLabId) {
        return res.status(403).json({ error: "You can only access reports from your assigned laboratory" });
      }
    }
    
    if (status) where.status = Array.isArray(status) ? status[0] : status;
    if (exclude_status) where.status = { not: String(exclude_status) };
    if (start_date && end_date) {
      const startDate = String(Array.isArray(start_date) ? start_date[0] : start_date) as string;
      const endDate = String(Array.isArray(end_date) ? end_date[0] : end_date) as string;
      where.report_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const reports = await prisma.daily_reports.findMany({
      where,
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      },
      orderBy: { report_date: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error("Error fetching daily reports:", error);
    res.status(500).json({ error: "Failed to fetch daily reports" });
  }
};

// GET single daily report by ID
export const getDailyReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get user info from authentication
    const authenticatedUserId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!authenticatedUserId) {
      return res.status(401).json({ error: "User authentication required" });
    }
    
    // Fetch user's lab assignment from database
    const user = await prisma.users.findUnique({
      where: { user_id: authenticatedUserId },
      select: { lab_id: true }
    });
    
    const userLabId = user?.lab_id;
    
    const reportId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
    
    const report = await prisma.daily_reports.findUnique({
      where: { report_id: reportId },
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: "Daily report not found" });
    }

    // Security check: Custodians can only access reports from their own lab
    if (userRole !== 'Admin' && report.lab_id !== userLabId) {
      return res.status(403).json({ error: "Access denied: You can only access reports from your assigned laboratory" });
    }

    // Format the response to match frontend expectations
    // Fetch related data separately since relations were removed from schema
    const [workstationItems, reportProcedures] = await Promise.all([
      // Get workstation items for this report
      prisma.report_workstation_items.findMany({
        where: { report_id: reportId }
      }),
      // Get procedures for this report
      prisma.daily_report_procedures.findMany({
        where: { report_id: reportId },
        include: {
          procedure: true
        }
      })
    ]);

    // Fetch workstation details for the items
    const workstationIds = workstationItems.map(item => item.workstation_id);
    const workstationDetails = workstationIds.length > 0 
      ? await prisma.workstations.findMany({
          where: { workstation_id: { in: workstationIds } },
          select: { workstation_id: true, workstation_name: true }
        })
      : [];

    const workstationMap = new Map(workstationDetails.map(ws => [ws.workstation_id, ws]));

    const formattedReport = {
      ...report,
      workstation_items: workstationItems.map((item: any) => {
        const ws = workstationMap.get(item.workstation_id);
        return {
          workstation_id: item.workstation_id,
          workstation_name: ws?.workstation_name || 'Unknown',
          status: item.status || 'Working',
          remarks: item.remarks || null
        };
      }),
      procedures: reportProcedures.map((rp: any) => {
        const procedure = rp.procedure;
        return {
          procedure_id: rp.procedure_id,
          procedure_name: procedure?.procedure_name || 'Unknown Procedure',
          category: procedure?.category || null,
          overall_status: rp.overall_status || 'Pending',
          overall_remarks: rp.overall_remarks || null,
          checklists: [] // Empty since procedure_checklists was removed
        };
      })
    };

    res.json(formattedReport);
  } catch (error) {
    console.error("Error fetching daily report:", error);
    res.status(500).json({ error: "Failed to fetch daily report" });
  }
};

// CREATE new daily report
export const createDailyReport = async (req: Request, res: Response) => {
  try {
    const {
      lab_id,
      report_date,
      general_remarks,
      checklist_items
    } = req.body;

    // Get user ID from authenticated request
    const user_id = req.user?.userId;
    const user_role = req.user?.role;
    if (!user_id) {
      return res.status(401).json({ error: "User authentication required" });
    }

    // For non-admin users, validate they can only create reports for their assigned lab
    if (user_role !== 'Admin') {
      const user = await prisma.users.findUnique({
        where: { user_id },
        select: { lab_id: true }
      });

      if (!user?.lab_id || user.lab_id !== lab_id) {
        return res.status(403).json({ error: "You can only create reports for your assigned laboratory" });
      }
    }

    // Check how many reports already exist for this user, lab, and date (max 10)
    const existingReports = await prisma.daily_reports.count({
      where: {
        user_id,
        lab_id,
        report_date: new Date(report_date)
      }
    });

    if (existingReports >= 10) {
      return res.status(400).json({ error: "Maximum 10 reports allowed per day for each laboratory" });
    }

    // Create the daily report
    const newReport = await prisma.daily_reports.create({
      data: {
        user_id,
        lab_id,
        report_date: new Date(report_date),
        general_remarks,
        status: 'Pending'
      },
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      }
    });

    // Create checklist items if provided (removed since we no longer use standard tasks)

    // Fetch the complete report
    const completeReport = await prisma.daily_reports.findUnique({
      where: { report_id: newReport.report_id },
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      }
    });

    res.status(201).json(completeReport);
  } catch (error) {
    console.error("Error creating daily report:", error);
    res.status(500).json({ error: "Failed to create daily report" });
  }
};

// UPDATE daily report
export const updateDailyReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reportId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
    const {
      general_remarks,
      status,
      checklist_items
    } = req.body;

    // Check if report exists
    const existingReport = await prisma.daily_reports.findUnique({
      where: { report_id: reportId }
    });

    if (!existingReport) {
      return res.status(404).json({ error: "Daily report not found" });
    }

    // Authorization check: only Admin can approve, or user can update their own pending reports
    const user_id = req.user?.userId;
    const user_role = req.user?.role;
    
    if (user_role !== 'Admin' && existingReport.user_id !== user_id) {
      return res.status(403).json({ error: "Not authorized to update this report" });
    }

    if (user_role !== 'Admin' && status === 'Approved') {
      return res.status(403).json({ error: "Only Admin can approve reports" });
    }

    // Validate status
    const validStatuses = ['Pending', 'Approved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Valid statuses are: Pending, Approved" });
    }

    // Update the report
    const updatedReport = await prisma.daily_reports.update({
      where: { report_id: reportId },
      data: {
        general_remarks: general_remarks !== undefined ? general_remarks : existingReport.general_remarks,
        status: status || existingReport.status
      },
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      }
    });

    // Update checklist items if provided (removed since we no longer use standard tasks)

    // Fetch the complete updated report
    const completeReport = await prisma.daily_reports.findUnique({
      where: { report_id: reportId },
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      }
    });

    res.json(completeReport);
  } catch (error) {
    console.error("Error updating daily report:", error);
    res.status(500).json({ error: "Failed to update daily report" });
  }
};

// DELETE daily report (Admin only)
export const deleteDailyReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reportId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);

    // Check if report exists
    const existingReport = await prisma.daily_reports.findUnique({
      where: { report_id: reportId }
    });

    if (!existingReport) {
      return res.status(404).json({ error: "Daily report not found" });
    }

    // Delete the report (this will cascade delete checklist items)
    await prisma.daily_reports.delete({
      where: { report_id: reportId }
    });

    res.json({ message: "Daily report deleted successfully" });
  } catch (error) {
    console.error("Error deleting daily report:", error);
    res.status(500).json({ error: "Failed to delete daily report" });
  }
};

// GET reports for current user
export const getMyDailyReports = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.userId;
    if (!user_id) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const { status, start_date, end_date, exclude_status } = req.query;
    
    // Get user's lab assignment for proper filtering
    const user = await prisma.users.findUnique({
      where: { user_id },
      select: { lab_id: true }
    });
    
    const where: any = { lab_id: user?.lab_id };
    
    // Exclude approved reports by default (they go to archived)
    if (exclude_status) {
      where.status = { not: String(exclude_status) };
    } else {
      // Default to excluding approved reports
      where.status = { not: 'Approved' };
    }
    
    // Allow status override if explicitly provided
    if (status) {
      where.status = Array.isArray(status) ? status[0] : status;
    }
    
    if (start_date && end_date) {
      const startDate = String(Array.isArray(start_date) ? start_date[0] : start_date) as string;
      const endDate = String(Array.isArray(end_date) ? end_date[0] : end_date) as string;
      where.report_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const reports = await prisma.daily_reports.findMany({
      where,
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      },
      orderBy: { report_date: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error("Error fetching user daily reports:", error);
    res.status(500).json({ error: "Failed to fetch daily reports" });
  }
};
