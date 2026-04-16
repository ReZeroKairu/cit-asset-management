import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get all procedures
export const getAllProcedures = async (req: Request, res: Response) => {
  try {
    const procedures = await prisma.procedures.findMany({
      where: { is_active: true },
      orderBy: { procedure_name: 'asc' }
    });

    res.json(procedures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch procedures" });
  }
};

// GET: Get procedures for a specific daily report
export const getReportProcedures = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({ error: "Report ID is required" });
    }

    const reportProcedures = await prisma.daily_report_procedures.findMany({
      where: { report_id: Number(reportId) }
    });

    // Get procedure details separately
    const procedureIds = reportProcedures.map(rp => rp.procedure_id);
    const procedures = await prisma.procedures.findMany({
      where: { procedure_id: { in: procedureIds } }
    });

    // Format procedures to match frontend expectations
    const formattedProcedures = procedures.map(procedure => ({
      procedure_id: procedure.procedure_id,
      procedure_name: procedure.procedure_name,
      procedure_description: "", // No description field in schema
      category: procedure.category || "",
      is_checked: reportProcedures.some(rp => rp.procedure_id === procedure.procedure_id)
    }));

    res.json(formattedProcedures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report procedures" });
  }
};

// POST: Save procedures for a daily report
export const saveReportProcedures = async (req: Request, res: Response) => {
  try {
    const { reportId, procedures } = req.body;

    if (!reportId || !Array.isArray(procedures)) {
      return res.status(400).json({ error: "Report ID and procedures array are required" });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing procedure data for this report
      await tx.daily_report_procedures.deleteMany({
        where: { report_id: Number(reportId) }
      });

      // Insert new procedure data
      const savedProcedures = await Promise.all(
        procedures.map(async (proc: any) => {
          // Create the daily report procedure
          const dailyReportProcedure = await tx.daily_report_procedures.create({
            data: {
              report_id: Number(reportId),
              procedure_id: proc.procedure_id,
              overall_status: proc.overall_status || 'Pending',
              overall_remarks: proc.overall_remarks || null
            }
          });

          return dailyReportProcedure;
        })
      );

      return savedProcedures;
    });

    res.json({
      message: `Successfully saved ${result.length} procedures`,
      procedures: result
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to save report procedures" });
  }
};

// GET: Get procedures for workstation report (procedures applicable to workstations)
export const getWorkstationProcedures = async (req: Request, res: Response) => {
  try {
    // Get procedures that are typically applicable to workstations
    const workstationProcedures = await prisma.procedures.findMany({
      where: { 
        is_active: true,
        category: {
          in: ['Hardware', 'Software', 'Network', 'Security', 'Maintenance']
        }
      },
      orderBy: { procedure_name: 'asc' }
    });

    res.json(workstationProcedures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch workstation procedures" });
  }
};
