//backend/src/controllers/dailyReportController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all daily reports (with filtering options)
export const getAllDailyReports = async (req: Request, res: Response) => {
  try {
    const { lab_id, user_id, status, start_date, end_date, exclude_status } = req.query;
    
    const where: any = {};
    
    if (lab_id) where.lab_id = parseInt(lab_id as string);
    if (user_id) where.user_id = parseInt(user_id as string);
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
    
    const reportId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
    
    const report = await prisma.daily_reports.findUnique({
      where: { report_id: reportId },
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
              include: {
                procedure_checklists: true
              }
            },
            daily_report_checklist_responses: {
              include: {
                procedure_checklists: true
              }
            }
          }
        }
      }
    } as any);

    if (!report) {
      return res.status(404).json({ error: "Daily report not found" });
    }

    // Format the response to match frontend expectations
    const formattedReport = {
      ...report,
      workstation_items: (report as any).report_workstation_items.map((item: any) => ({
        workstation_id: item.workstation_id,
        workstation_name: item.workstations?.workstation_name || 'Unknown',
        status: item.status,
        remarks: item.remarks,
        workstation: item.workstations
      })),
      procedures: (report as any).daily_report_procedures.map((rp: any) => {
        const procedure = rp.procedures;
        const responses = rp.daily_report_checklist_responses;

        // Attach responses to the corresponding checklists
        const checklistsWithResponses = procedure.procedure_checklists.map((checklist: any) => {
          const response = responses.find((r: any) => r.checklist_id === checklist.checklist_id);
          return {
            checklist_id: checklist.checklist_id,
            checklist_name: checklist.checklist_name,
            status: response?.status || 'Pending',
            remarks: response?.remarks || null,
            response_id: response?.response_id || null
          };
        });

        return {
          procedure_id: procedure.procedure_id,
          procedure_name: procedure.procedure_name,
          overall_status: rp.overall_status,
          overall_remarks: rp.overall_remarks,
          checklists: checklistsWithResponses
        };
      })
    };

    // Remove the original nested data to avoid confusion
    delete (formattedReport as any).report_workstation_items;
    delete (formattedReport as any).daily_report_procedures;

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

    const { status, start_date, end_date } = req.query;
    
    const where: any = { user_id };
    
    if (status) where.status = Array.isArray(status) ? status[0] : status;
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
