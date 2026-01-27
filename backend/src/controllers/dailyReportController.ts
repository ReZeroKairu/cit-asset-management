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
        },
        report_checklist_items: {
          include: {
            standard_tasks: true
          }
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
        report_checklist_items: {
          include: {
            standard_tasks: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: "Daily report not found" });
    }

    res.json(report);
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
      time_in,
      time_out,
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
        time_in: time_in ? new Date(`1970-01-01T${time_in}`) : null,
        time_out: time_out ? new Date(`1970-01-01T${time_out}`) : null,
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

    // Create checklist items if provided
    if (checklist_items && checklist_items.length > 0) {
      const checklistData = checklist_items.map((item: any) => ({
        report_id: newReport.report_id,
        task_id: item.task_id,
        task_status: item.task_status || 'Done',
        specific_remarks: item.specific_remarks || null
      }));

      await prisma.report_checklist_items.createMany({
        data: checklistData
      });
    }

    // Fetch the complete report with checklist items
    const completeReport = await prisma.daily_reports.findUnique({
      where: { report_id: newReport.report_id },
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        },
        report_checklist_items: {
          include: {
            standard_tasks: true
          }
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
      time_in,
      time_out,
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
        time_in: time_in ? new Date(`1970-01-01T${time_in}`) : existingReport.time_in,
        time_out: time_out ? new Date(`1970-01-01T${time_out}`) : existingReport.time_out,
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

    // Update checklist items if provided
    if (checklist_items && checklist_items.length > 0) {
      // Delete existing checklist items
      await prisma.report_checklist_items.deleteMany({
        where: { report_id: reportId }
      });

      // Create new checklist items
      const checklistData = checklist_items.map((item: any) => ({
        report_id: reportId,
        task_id: item.task_id,
        task_status: item.task_status || 'Done',
        specific_remarks: item.specific_remarks || null
      }));

      await prisma.report_checklist_items.createMany({
        data: checklistData
      });
    }

    // Fetch the complete updated report
    const completeReport = await prisma.daily_reports.findUnique({
      where: { report_id: reportId },
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        },
        report_checklist_items: {
          include: {
            standard_tasks: true
          }
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
        },
        report_checklist_items: {
          include: {
            standard_tasks: true
          }
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
