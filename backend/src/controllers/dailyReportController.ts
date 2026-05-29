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

    const pageStr = Array.isArray(page) ? page[0] : page;
    const limitStr = Array.isArray(limit) ? limit[0] : limit;
    const pageNum = parseInt(String(pageStr || '1'));
    const limitNum = parseInt(String(limitStr || '10'));
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await prisma.daily_reports.count({ where });

    const reports = await prisma.daily_reports.findMany({
      where,
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        },
        report_workstation_items: {
          include: {
            workstations: {
              select: { workstation_id: true, workstation_name: true }
            }
          }
        },
        daily_report_procedures: {
          include: {
            procedures: {
              select: { procedure_id: true, procedure_name: true, category: true }
            }
          }
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
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: reports
    });
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
      select: {
        report_id: true,
        user_id: true,
        lab_id: true,
        report_date: true,
        report_type: true,
        general_remarks: true,
        status: true,
        created_at: true,
        generated_data: true,
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
        where: { report_id: reportId }
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

    // Fetch procedure details for the report procedures
    const procedureIds = reportProcedures.map(rp => rp.procedure_id);
    const procedureDetails = procedureIds.length > 0 
      ? await prisma.procedures.findMany({
          where: { procedure_id: { in: procedureIds } },
          select: { procedure_id: true, procedure_name: true, category: true }
        })
      : [];

    const procedureMap = new Map(procedureDetails.map(p => [p.procedure_id, p]));

    const formattedReport = {
      ...report,
      generated_data: (report as any).generated_data || {},
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
        const procedure = procedureMap.get(rp.procedure_id);
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
        status: 'Pending',
        report_type: 'manual' // Default for manual creation
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
      checklist_items,
      generated_data
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

    // Prepare update data
    const updateData: any = {
      general_remarks: general_remarks !== undefined ? general_remarks : existingReport.general_remarks,
      status: status || existingReport.status
    };

    // Include generated_data if provided (for unified reports)
    if (generated_data !== undefined) {
      updateData.generated_data = generated_data;
    }

    // Update the report
    const updatedReport = await prisma.daily_reports.update({
      where: { report_id: reportId },
      data: updateData,
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


// CREATE auto-generated daily report - handles report_type field
export const createAutoGeneratedReport = async (req: Request, res: Response) => {
  try {
    const {
      lab_id,
      report_date,
      report_type, // 'auto_complaints' or 'auto_forms'
      general_remarks,
      generated_data, // JSON data containing complaints/forms info
      procedures, // Array of procedures for the report
      workstation_items // Array of workstation items for the report
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

    // Validate report_type
    const validReportTypes = ['auto_complaints', 'auto_forms', 'auto_maintenance', 'unified'];
    if (!validReportTypes.includes(report_type)) {
      return res.status(400).json({ error: "Invalid report type. Valid types are: auto_complaints, auto_forms, auto_maintenance, unified" });
    }

    // Create the auto-generated daily report
    const newReport = await prisma.daily_reports.create({
      data: {
        user_id,
        lab_id,
        report_date: new Date(report_date),
        general_remarks,
        status: 'Pending', // Auto-generated reports need admin approval
        report_type,
        generated_data: generated_data || {}
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

    // Save procedures if provided
    console.log('💾 Procedures to save:', procedures);
    if (procedures && Array.isArray(procedures)) {
      for (const procedure of procedures) {
        console.log('💾 Saving procedure:', procedure);
        await prisma.daily_report_procedures.create({
          data: {
            report_id: newReport.report_id,
            procedure_id: procedure.procedure_id,
            overall_status: procedure.overall_status || "Pending",
            overall_remarks: procedure.overall_remarks || ""
          }
        });
      }
    }

    // Save workstation items if provided
    if (workstation_items && Array.isArray(workstation_items)) {
      for (const workstation of workstation_items) {
        await prisma.report_workstation_items.create({
          data: {
            report_id: newReport.report_id,
            workstation_id: workstation.workstation_id,
            status: workstation.status || "Working",
            remarks: workstation.remarks || ""
          }
        });
      }
    }

    // Fetch the complete report with procedures and workstation items
    const completeReport = await prisma.daily_reports.findUnique({
      where: { report_id: newReport.report_id },
      select: {
        report_id: true,
        user_id: true,
        lab_id: true,
        report_date: true,
        report_type: true,
        general_remarks: true,
        status: true,
        created_at: true,
        generated_data: true,
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      }
    });

    // Fetch related data separately
    const [workstationItems, reportProcedures] = await Promise.all([
      prisma.report_workstation_items.findMany({
        where: { report_id: newReport.report_id },
        include: {
          workstations: {
            select: { workstation_id: true, workstation_name: true }
          }
        }
      }),
      prisma.daily_report_procedures.findMany({
        where: { report_id: newReport.report_id },
        include: {
          procedures: {
            select: { procedure_id: true, procedure_name: true, category: true }
          }
        }
      })
    ]);

    const formattedReport = {
      ...completeReport,
      generated_data: (completeReport as any).generated_data || {},
      workstation_items: workstationItems.map((item: any) => ({
        workstation_id: item.workstation_id,
        workstation_name: item.workstations?.workstation_name || 'Unknown',
        status: item.status || 'Working',
        remarks: item.remarks || null
      })),
      procedures: reportProcedures.map((rp: any) => ({
        procedure_id: rp.procedure_id,
        procedure_name: rp.procedures?.procedure_name || 'Unknown Procedure',
        category: rp.procedures?.category || null,
        overall_status: rp.overall_status || 'Pending',
        overall_remarks: rp.overall_remarks || null
      }))
    };

    res.status(201).json(formattedReport);
  } catch (error) {
    console.error("Error creating auto-generated daily report:", error);
    res.status(500).json({ error: "Failed to create auto-generated daily report" });
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
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error("Error fetching user daily reports:", error);
    res.status(500).json({ error: "Failed to fetch daily reports" });
  }
};

// GET unified daily reports (combines auto_complaints and auto_forms for same date/user)
export const getUnifiedDailyReports = async (req: Request, res: Response) => {
  try {
    const { status, start_date, end_date } = req.query;
    
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
      report_type: { in: ['auto_complaints', 'auto_forms', 'auto_maintenance', 'unified'] }
    };
    
    // Role-based filtering
    if (userRole === 'Custodian') {
      // Custodians can only see reports from their assigned lab
      where.lab_id = userLabId;
    }
    
    if (status) where.status = Array.isArray(status) ? status[0] : status;
    if (start_date && end_date) {
      const startDate = String(Array.isArray(start_date) ? start_date[0] : start_date) as string;
      const endDate = String(Array.isArray(end_date) ? end_date[0] : end_date) as string;
      where.report_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Fetch all auto-generated reports
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
      orderBy: [
        { report_date: 'desc' },
        { created_at: 'desc' }
      ]
    });

    // Group reports by user_id, lab_id, and report_date
    const groupedReports = new Map();
    
    reports.forEach(report => {
      const key = `${report.user_id}-${report.lab_id}-${report.report_date.toISOString().split('T')[0]}`;
      
      if (!groupedReports.has(key)) {
        groupedReports.set(key, {
          user_id: report.user_id,
          lab_id: report.lab_id,
          report_date: report.report_date,
          users: report.users,
          laboratories: report.laboratories,
          complaints_report: null,
          forms_report: null,
          report_ids: [],
          status: report.status,
          created_at: report.created_at
        });
      }
      
      const group = groupedReports.get(key);
      
      if (report.report_type === 'auto_complaints') {
        group.complaints_report = report;
      } else if (report.report_type === 'auto_forms') {
        group.forms_report = report;
      }
      
      group.report_ids.push(report.report_id);
      
      // Update status if any report is approved
      if (report.status === 'Approved') {
        group.status = 'Approved';
      }
    });

    // Convert map to array and add a unified report_id (use the first report's ID)
    const unifiedReports = Array.from(groupedReports.values()).map(group => ({
      ...group,
      report_id: group.report_ids[0], // Use first report ID as the unified ID
      all_report_ids: group.report_ids,
      report_type: 'unified' // Mark as unified
    }));

    res.json({
      success: true,
      data: unifiedReports
    });
  } catch (error) {
    console.error("Error fetching unified daily reports:", error);
    res.status(500).json({ error: "Failed to fetch unified daily reports" });
  }
};

// GET unified daily report by ID (fetches both complaints and forms reports)
export const getUnifiedDailyReportById = async (req: Request, res: Response) => {
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
    
    // Fetch the report to get user_id, lab_id, and report_date
    const baseReport = await prisma.daily_reports.findUnique({
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

    if (!baseReport) {
      return res.status(404).json({ error: "Daily report not found" });
    }

    // Security check: Custodians can only access reports from their own lab
    if (userRole !== 'Admin' && baseReport.lab_id !== userLabId) {
      return res.status(403).json({ error: "Access denied: You can only access reports from your assigned laboratory" });
    }

    // Fetch both auto_complaints, auto_forms, and unified reports for the same user, lab, and date
    const reports = await prisma.daily_reports.findMany({
      where: {
        user_id: baseReport.user_id,
        lab_id: baseReport.lab_id,
        report_date: baseReport.report_date,
        report_type: { in: ['auto_complaints', 'auto_forms', 'unified'] }
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

    // Fetch detailed data for each report
    const detailedReports = await Promise.all(
      reports.map(async (report) => {
        const [workstationItems, reportProcedures] = await Promise.all([
          prisma.report_workstation_items.findMany({
            where: { report_id: report.report_id }
          }),
          prisma.daily_report_procedures.findMany({
            where: { report_id: report.report_id }
          })
        ]);

        const workstationIds = workstationItems.map(item => item.workstation_id);
        const workstationDetails = workstationIds.length > 0 
          ? await prisma.workstations.findMany({
              where: { workstation_id: { in: workstationIds } },
              select: { workstation_id: true, workstation_name: true }
            })
          : [];

        const workstationMap = new Map(workstationDetails.map(ws => [ws.workstation_id, ws]));

        const procedureIds = reportProcedures.map(rp => rp.procedure_id);
        const procedureDetails = procedureIds.length > 0 
          ? await prisma.procedures.findMany({
              where: { procedure_id: { in: procedureIds } },
              select: { procedure_id: true, procedure_name: true, category: true }
            })
          : [];

        const procedureMap = new Map(procedureDetails.map(p => [p.procedure_id, p]));

        return {
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
            const procedure = procedureMap.get(rp.procedure_id);
            return {
              procedure_id: rp.procedure_id,
              procedure_name: procedure?.procedure_name || 'Unknown Procedure',
              category: procedure?.category || null,
              overall_status: rp.overall_status || 'Pending',
              overall_remarks: rp.overall_remarks || null,
              checklists: []
            };
          })
        };
      })
    );

    // Check if the base report is already a unified report
    if (baseReport.report_type === 'unified') {
      // Fetch detailed data for the unified report
      const [workstationItems, reportProcedures] = await Promise.all([
        prisma.report_workstation_items.findMany({
          where: { report_id: reportId }
        }),
        prisma.daily_report_procedures.findMany({
          where: { report_id: reportId }
        })
      ]);

      const workstationIds = workstationItems.map(item => item.workstation_id);
      const workstationDetails = workstationIds.length > 0 
        ? await prisma.workstations.findMany({
            where: { workstation_id: { in: workstationIds } },
            select: { workstation_id: true, workstation_name: true }
          })
        : [];

      const workstationMap = new Map(workstationDetails.map(ws => [ws.workstation_id, ws]));

      const procedureIds = reportProcedures.map(rp => rp.procedure_id);
      const procedureDetails = procedureIds.length > 0 
        ? await prisma.procedures.findMany({
            where: { procedure_id: { in: procedureIds } },
            select: { procedure_id: true, procedure_name: true, category: true }
          })
        : [];

      const procedureMap = new Map(procedureDetails.map(p => [p.procedure_id, p]));

      const unifiedReport = {
        report_id: reportId,
        user_id: baseReport.user_id,
        lab_id: baseReport.lab_id,
        report_date: baseReport.report_date,
        users: baseReport.users,
        laboratories: baseReport.laboratories,
        status: baseReport.status,
        created_at: baseReport.created_at,
        report_type: 'unified',
        generated_data: (baseReport as any).generated_data || {},
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
          const procedure = procedureMap.get(rp.procedure_id);
          return {
            procedure_id: rp.procedure_id,
            procedure_name: procedure?.procedure_name || 'Unknown Procedure',
            category: procedure?.category || null,
            overall_status: rp.overall_status || 'Pending',
            overall_remarks: rp.overall_remarks || null,
            checklists: []
          };
        }),
        complaints_report: null,
        forms_report: null,
        all_report_ids: [reportId]
      };

      res.json(unifiedReport);
      return;
    }

    // Separate into complaints and forms reports
    const complaintsReport = detailedReports.find(r => r.report_type === 'auto_complaints');
    const formsReport = detailedReports.find(r => r.report_type === 'auto_forms');

    const unifiedReport = {
      report_id: reportId,
      user_id: baseReport.user_id,
      lab_id: baseReport.lab_id,
      report_date: baseReport.report_date,
      users: baseReport.users || (detailedReports[0]?.users),
      laboratories: baseReport.laboratories || (detailedReports[0]?.laboratories),
      status: detailedReports.some(r => r.status === 'Approved') ? 'Approved' : 'Pending',
      created_at: detailedReports[0]?.created_at || baseReport.created_at,
      report_type: 'unified',
      complaints_report: complaintsReport || null,
      forms_report: formsReport || null,
      all_report_ids: detailedReports.map(r => r.report_id)
    };

    res.json(unifiedReport);
  } catch (error) {
    console.error("Error fetching unified daily report:", error);
    res.status(500).json({ error: "Failed to fetch unified daily report" });
  }
};

// GENERATE unified report server-side - fetches complaints and forms data from database
export const generateUnifiedReport = async (req: Request, res: Response) => {
  try {
    const { report_date, lab_id } = req.body;

    // Get user ID from authenticated request
    const user_id = req.user?.userId;
    if (!user_id) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const user = await prisma.users.findUnique({
      where: { user_id },
      select: { lab_id: true }
    });
    const userLabId = user?.lab_id;

    // Use provided lab_id or user's assigned lab
    const targetLabId = lab_id || userLabId;

    // Construct date range for the selected local date
    // This ensures consistency with frontend's local date filtering
    const startOfLocalDay = new Date(new Date(report_date).setHours(0, 0, 0, 0));
    const endOfLocalDay = new Date(new Date(report_date).setHours(23, 59, 59, 999));

    // Fetch resolved complaints for the date
    const complaints = await prisma.complaints.findMany({
      where: {
        status: 'Resolved',
        resolved_at: {
          gte: startOfLocalDay,
          lt: endOfLocalDay
        },
        ...(targetLabId && { lab_id: targetLabId })
      },
      include: {
        workstations: { select: { workstation_name: true } }
      },
      orderBy: { resolved_at: 'asc' }
    });

    // Fetch completed software installations for the date
    const softwareInstallations = await prisma.software_installations.findMany({
      where: {
        status: 'Completed',
        completed_at: { // Strictly filter by completed_at
          gte: startOfLocalDay,
          lt: endOfLocalDay,
          not: null // Ensure completed_at is not null
        }
      },
      orderBy: {
        completed_at: 'asc' // Sort by completed_at old to latest
      }
    });

    // Fetch maintenance services for the date (only ROUTINE services)
    const maintenanceServices = await prisma.service_logs.findMany({
      where: {
        service_date: {
          gte: startOfLocalDay,
          lt: endOfLocalDay
        },
        service_type: 'ROUTINE',
        ...(targetLabId && { pmc_reports: { lab_id: targetLabId } })
      },
      include: {
        pmc_reports: {
          include: {
            workstations: { select: { workstation_name: true } },
            pmc_report_procedures: {
              include: {
                procedures: { select: { procedure_id: true, procedure_name: true, category: true } }
              }
            }
          }
        },
        service_log_procedures: {
          include: {
            procedures: { select: { procedure_id: true, procedure_name: true, category: true } }
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    // De-duplicate maintenance by workstation
    const latestServicesMap = new Map();
    maintenanceServices.forEach(log => {
      const wsId = log.pmc_reports?.workstation_id;
      if (wsId) latestServicesMap.set(wsId, log);
    });

    const uniqueMaintenanceServices = Array.from(latestServicesMap.values())
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const flattenedMaintenanceServices = uniqueMaintenanceServices.map((service: any) => ({
      ...service,
      workstation_name: service.pmc_reports?.workstations?.workstation_name || 'Unknown WS',
      overall_remarks: service.pmc_reports?.overall_remarks || service.remarks || 'No remarks'
    }));

    if (complaints.length === 0 && softwareInstallations.length === 0 && flattenedMaintenanceServices.length === 0) {
      return res.status(400).json({ error: "No data found for the selected date" });
    }

    // Generate remarks
    const complaintsRemarks = complaints.map((c: any) => {
      const time = new Date(c.resolved_at || c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `• ${time} - ${c.workstations?.workstation_name || 'Unknown WS'} [Asset: ${c.asset_info || 'N/A'}] (${c.status}) - Remarks: ${c.remarks || 'No remarks'}`;
    }).join('\n');

    const formsRemarks = softwareInstallations.map((f: any) => {
      const time = new Date(f.completed_at || f.updated_at || f.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `• ${time} - Software: ${f.software_list} [Faculty: ${f.faculty_name}] - ${f.installation_remarks || 'No remarks'}`;
    }).join('\n');

    const maintenanceRemarks = flattenedMaintenanceServices.map((service: any) => {
      const time = new Date(service.created_at || service.service_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `• ${time} - ${service.workstation_name} - ${service.overall_remarks}`;
    }).join('\n');

    // Create the unified report
    const unifiedReport = await prisma.daily_reports.create({
      data: {
        user_id,
        lab_id: targetLabId || 2,
        report_date: new Date(report_date),
        report_type: 'unified',
        general_remarks: `Unified Report - ${complaints.length} complaints, ${softwareInstallations.length} software installations, ${flattenedMaintenanceServices.length} maintenance services`,
        generated_data: {
          complaints_count: complaints.length,
          software_installations_count: softwareInstallations.length,
          maintenance_services_count: flattenedMaintenanceServices.length,
          complaints_remarks: complaintsRemarks,
          forms_remarks: formsRemarks,
          maintenance_remarks: maintenanceRemarks,
          complaints: complaints.map((c: any) => ({
            complaint_id: c.complaint_id,
            workstation_id: c.workstation_id,
            workstation_name: c.workstations?.workstation_name || c.workstation_name,
            resolved_at: c.resolved_at,
            status: c.status,
            remarks: c.remarks,
            procedure_ids: [5, 6]
          })),
          software_installations: softwareInstallations.map((f: any) => ({
            id: f.id,
            faculty_name: f.faculty_name,
            software_list: f.software_list,
            installation_remarks: f.installation_remarks,
            completed_at: f.completed_at,
            workstations: [],
            procedure_ids: [2]
          })),
          maintenance_services: flattenedMaintenanceServices.map((m: any) => ({
            id: m.log_id,
            workstation_id: m.pmc_reports?.workstation_id,
            workstation_name: m.workstation_name,
            overall_remarks: m.overall_remarks,
            service_date: m.service_date,
            created_at: m.created_at,
            service_type: m.service_type,
            procedures: (() => {
              const allProcedures = [
                ...(m.service_log_procedures || []).map((slp: any) => ({
                  procedure_id: slp.procedures?.procedure_id,
                  procedure_name: slp.procedures?.procedure_name,
                  category: slp.procedures?.category
                })),
                ...(m.pmc_reports?.pmc_report_procedures || []).map((prp: any) => ({
                  procedure_id: prp.procedures?.procedure_id,
                  procedure_name: prp.procedures?.procedure_name,
                  category: prp.procedures?.category
                }))
              ];
              const darProcedures = new Map();
              allProcedures.forEach(proc => {
                const id = Number(proc.procedure_id);
                let darId = id;
                if (id === 8) darId = 5;
                else if (id === 9) darId = 2;
                else if (id === 10) darId = 3;
                else if (id === 11) darId = 4;
                else if (id === 12) darId = 7;
                else if (id === 13) darId = 6;
                if (darId >= 1 && darId <= 7 && !darProcedures.has(darId)) {
                  darProcedures.set(darId, { ...proc, procedure_id: darId });
                }
              });
              return Array.from(darProcedures.values());
            })()
          }))
        } as any,
        status: 'Pending'
      }
    });

    // Create procedures for the report to ensure visibility in DAR
    const allProcedureIds = new Set<number>();
    if (complaints.length > 0) { 
      allProcedureIds.add(5); 
      allProcedureIds.add(6); 
    }
    if (softwareInstallations.length > 0) {
      allProcedureIds.add(2);
    }
    
    // Dynamically extract all mapped DAR procedure IDs from maintenance services
    uniqueMaintenanceServices.forEach((m: any) => {
      const serviceProcs = [
        ...(m.service_log_procedures || []),
        ...(m.pmc_reports?.pmc_report_procedures || [])
      ];

      serviceProcs.forEach((sp: any) => {
        const id = Number(sp.procedures?.procedure_id);
        if (!id) return;

        // Map QPMC procedures (8-13) to DAR procedure IDs (1-7)
        let darId = id;
        if (id === 8) darId = 5;
        else if (id === 9) darId = 2;
        else if (id === 10) darId = 3;
        else if (id === 11) darId = 4;
        else if (id === 12) darId = 7;
        else if (id === 13) darId = 6;

        if (darId >= 1 && darId <= 7) allProcedureIds.add(darId);
      });
    });

    // Fallback: If maintenance records exist but no specific procedures found, default to ID 3
    if (uniqueMaintenanceServices.length > 0 && !Array.from(allProcedureIds).some(id => [1, 3, 4, 7].includes(id))) {
      allProcedureIds.add(3);
    }

    if (allProcedureIds.size > 0) {
      await prisma.daily_report_procedures.createMany({
        data: Array.from(allProcedureIds).map(procId => ({
          report_id: unifiedReport.report_id,
          procedure_id: procId,
          overall_status: 'Completed'
        }))
      });
    }

    res.status(201).json(unifiedReport);
  } catch (error) {
    console.error("Error generating unified report:", error);
    res.status(500).json({ error: "Failed to generate unified report" });
  }
};
