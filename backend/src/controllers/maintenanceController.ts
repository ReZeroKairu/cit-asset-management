import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET Reports for a Lab & Quarter
export const getLabPMCReports = async (req: Request, res: Response) => {
  try {
    const { lab_id, quarter } = req.query;

    if (!lab_id || !quarter) {
      return res.status(400).json({ error: "Lab ID and Quarter are required" });
    }

    const reports = await prisma.pmc_reports.findMany({
      where: {
        lab_id: Number(lab_id),
        quarter: String(quarter),
      },
      include: {
        procedures: {
          include: { procedure: true },
        },
      },
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

// 2. GET Single Report Details (For the View)
export const getPMCReportDetail = async (req: Request, res: Response) => {
  try {
    const { workstation_id, quarter } = req.query;

    const report = await prisma.pmc_reports.findFirst({
      where: {
        workstation_id: Number(workstation_id),
        quarter: String(quarter),
      },
      include: {
        procedures: {
          include: { procedure: true },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report detail" });
  }
};

// 3. CREATE/SAVE A Report
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
      procedure_ids, // Array of IDs [8, 9, 10]
    } = req.body;

    const user_id = req.user?.userId; // Assumes auth middleware adds this

    // Transaction: Create Report -> Link Procedures
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the main report
      const newReport = await tx.pmc_reports.create({
        data: {
          lab_id: Number(lab_id),
          workstation_id: Number(workstation_id),
          user_id: Number(user_id),
          report_date: new Date(report_date),
          quarter,
          workstation_status,
          overall_remarks,
          software_name,
          software_status,
          connectivity_type,
          connectivity_type_status,
          connectivity_speed,
          connectivity_speed_status,
        },
      });

      // 2. Create procedure entries if any are checked
      if (procedure_ids && procedure_ids.length > 0) {
        await tx.pmc_report_procedures.createMany({
          data: procedure_ids.map((id: number) => ({
            pmc_id: newReport.pmc_id,
            procedure_id: id,
            is_checked: true,
          })),
        });
      }

      return newReport;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Create PMC Error:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
};
