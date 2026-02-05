import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all Maintenance Reports (Filtered by type 'QPMC')
export const getAllMaintenanceReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.daily_reports.findMany({
      where: {
        report_type: "QPMC",
      },
      include: {
        users: { select: { full_name: true } },
        laboratories: { select: { lab_name: true, location: true } },
        // ✅ ADD THIS: Include workstation items so we know what was checked
        workstation_items: {
          select: { workstation_id: true },
        },
      },
      orderBy: { report_date: "desc" },
    });
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch maintenance reports" });
  }
};

// GET single Maintenance Report
export const getMaintenanceReportById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const report = await prisma.daily_reports.findUnique({
      where: { report_id: Number(id) },
      include: {
        // ✅ FIXED: Changed report_procedures to procedures (as defined in your schema)
        procedures: {
          include: {
            procedure: true, // ✅ FIXED: Changed procedures to procedure (singular relation name)
          },
        },
        workstation_items: {
          // ✅ FIXED: Changed workstation_reports to workstation_items
          include: {
            workstation: true, // ✅ FIXED: Changed workstations to workstation
          },
        },
      },
    });
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
};

// CREATE Maintenance Report
export const createMaintenanceReport = async (req: Request, res: Response) => {
  const { lab_id, report_date, general_remarks } = req.body;
  const userId = (req as any).user?.userId;

  try {
    const newReport = await prisma.daily_reports.create({
      data: {
        lab_id: Number(lab_id),
        user_id: userId,
        report_date: new Date(report_date),
        general_remarks,
        report_type: "QPMC",
        status: "Pending",
      },
    });
    res.json(newReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create maintenance report" });
  }
};

// UPDATE Maintenance Report
export const updateMaintenanceReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { report_date, general_remarks } = req.body;

  try {
    const updatedReport = await prisma.daily_reports.update({
      where: { report_id: Number(id) },
      data: {
        report_date: new Date(report_date),
        general_remarks,
      },
    });
    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ error: "Failed to update report" });
  }
};

// DELETE Maintenance Report
export const deleteMaintenanceReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.daily_reports.delete({
      where: { report_id: Number(id) },
    });
    res.json({ message: "Maintenance report deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete report" });
  }
};
