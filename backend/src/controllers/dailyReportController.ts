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

    // Get paginated reports with full details
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

// GENERATE unified report server-side - fetches complaints and forms data from database
export const generateUnifiedReport = async (req: Request, res: Response) => {
  try {
    const { report_date, lab_id } = req.body;

    // Get user ID from authenticated request
    const user_id = req.user?.userId;
    const user_role = req.user?.role;
    const userLabId = req.user?.lab_id;
    if (!user_id) {
      return res.status(401).json({ error: "User authentication required" });
    }

    // Use provided lab_id or user's assigned lab
    const targetLabId = lab_id || userLabId;

    // Fetch resolved complaints for the date
    const complaints = await prisma.complaints.findMany({
      where: {
        status: 'Resolved',
        resolved_at: {
          gte: new Date(`${report_date}T00:00:00`),
          lt: new Date(`${report_date}T23:59:59`)
        },
        ...(targetLabId && { lab_id: targetLabId })
      },
      include: {
        workstations: {
          select: { workstation_name: true }
        }
      }
    });

    // Fetch completed software installations for the date
    const softwareInstallations = await prisma.software_installations.findMany({
      where: {
        status: { in: ['Completed', 'Custodian_Approved'] },
        feedback_date: {
          gte: new Date(`${report_date}T00:00:00`),
          lt: new Date(`${report_date}T23:59:59`)
        }
      }
    });

    // Check if there's any data
    if (complaints.length === 0 && softwareInstallations.length === 0) {
      return res.status(400).json({ error: "No data found for the selected date" });
    }

    // Generate detailed remarks for complaints
    const complaintsRemarks = complaints.slice(0, 40).map((complaint: any) => {
      const timeString = complaint.resolved_at || complaint.created_at || '';
      const formattedTime = timeString ? new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : '';

      const workstationName = complaint.workstations?.workstation_name || complaint.workstation_name || 'Unknown WS';
      return `• ${formattedTime} - ${workstationName} [Asset: ${complaint.asset_info || 'N/A'}] (${complaint.status}) - Remarks: ${complaint.remarks || 'No remarks'}`;
    }).join('\n');

    // Generate detailed remarks for software installations
    const formsRemarks = softwareInstallations.slice(0, 40).map((form: any) => {
      const timeString = form.feedback_date || form.created_at || '';
      const formattedTime = timeString ? new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : '';

      const facultyName = form.faculty_name;
      const softwareName = form.software_list;
      const installationRemarks = form.installation_remarks;

      return `• ${formattedTime} - Software: ${softwareName} [Faculty: ${facultyName}] - ${installationRemarks || 'No remarks'}`;
    }).join('\n');

    // Create the unified report
    const unifiedReport = await prisma.daily_reports.create({
      data: {
        user_id,
        lab_id: targetLabId || 2,
        report_date: new Date(report_date),
        report_type: 'unified',
        general_remarks: `Unified Report - ${complaints.length} complaints, ${softwareInstallations.length} software installations`,
        generated_data: {
          complaints_count: complaints.length,
          software_installations_count: softwareInstallations.length,
          complaints_remarks: complaintsRemarks,
          forms_remarks: formsRemarks,
          complaints: complaints.slice(0, 40).map((c: any) => ({
            id: c.id,
            complaint_id: c.complaint_id,
            issue_description: c.issue_description,
            workstation_name: c.workstations?.workstation_name || c.workstation_name,
            resolved_at: c.resolved_at,
            status: c.status,
            asset_info: c.asset_info,
            remarks: c.remarks
          })),
          software_installations: softwareInstallations.slice(0, 40).map((f: any) => ({
            id: f.id,
            faculty_name: f.faculty_name,
            software_list: f.software_list,
            installation_remarks: f.installation_remarks,
            laboratory: f.laboratory,
            created_at: f.created_at
          }))
        } as any,
        status: 'Pending'
      } as any,
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      }
    });

    // Create procedures for the report
    if (complaints.length > 0) {
      await prisma.daily_report_procedures.createMany({
        data: [
          { report_id: unifiedReport.report_id, procedure_id: 5, overall_status: 'Completed', overall_remarks: '' },
          { report_id: unifiedReport.report_id, procedure_id: 6, overall_status: 'Completed', overall_remarks: '' }
        ]
      });
    }
    if (softwareInstallations.length > 0) {
      await prisma.daily_report_procedures.create({
        data: { report_id: unifiedReport.report_id, procedure_id: 2, overall_status: 'Completed', overall_remarks: '' }
      });
    }

    // Create workstation items from complaints
    if (complaints.length > 0) {
      const workstationItems = complaints.slice(0, 40).map((c: any) => ({
        report_id: unifiedReport.report_id,
        workstation_id: 1, // Default workstation ID since complaints don't have workstation_id
        status: 'Working',
        remarks: c.remarks || ''
      }));
      await prisma.report_workstation_items.createMany({
        data: workstationItems
      });
    }

    res.json(unifiedReport);
  } catch (error) {
    console.error("Error generating unified report:", error);
    res.status(500).json({ error: "Failed to generate unified report" });
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
    const validReportTypes = ['auto_complaints', 'auto_forms', 'unified'];
    if (!validReportTypes.includes(report_type)) {
      return res.status(400).json({ error: "Invalid report type. Valid types are: auto_complaints, auto_forms, unified" });
    }

    // Create the auto-generated daily report
    const newReport = await prisma.daily_reports.create({
      data: {
        user_id,
        lab_id,
        report_date: new Date(report_date),
        general_remarks,
        status: 'Pending', // Auto-generated reports need admin approval
        report_type
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
    if (procedures && Array.isArray(procedures)) {
      for (const procedure of procedures) {
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

    res.status(201).json(newReport);
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
      report_type: { in: ['auto_complaints', 'auto_forms', 'unified'] }
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
