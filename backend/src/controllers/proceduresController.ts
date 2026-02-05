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
    console.error("Error fetching procedures:", error);
    res.status(500).json({ error: "Failed to fetch procedures" });
  }
};

// GET: Get procedures for a specific daily report
export const getReportProcedures = async (req: Request, res: Response) => {
  try {
    console.log('Backend: getReportProcedures called with params:', req.params); // Debug log
    const { reportId } = req.params;

    if (!reportId) {
      console.log('Backend: No reportId provided'); // Debug log
      return res.status(400).json({ error: "Report ID is required" });
    }

    console.log('Backend: Looking for procedures with report_id:', Number(reportId)); // Debug log

    const reportProcedures = await prisma.daily_report_procedures.findMany({
      where: { report_id: Number(reportId) }
    });

    console.log('Backend: Found reportProcedures:', reportProcedures.length); // Debug log

    // Get procedure details separately
    const procedureIds = reportProcedures.map(rp => rp.procedure_id);
    const procedures = await prisma.procedures.findMany({
      where: { procedure_id: { in: procedureIds } }
    });

    // Format the response
    const formattedProcedures = reportProcedures.map(rp => {
      const procedure = procedures.find(p => p.procedure_id === rp.procedure_id);
      
      return {
        procedure_id: rp.procedure_id,
        procedure_name: procedure?.procedure_name || 'Unknown Procedure',
        category: procedure?.category || null,
        overall_status: rp.overall_status,
        overall_remarks: rp.overall_remarks
      };
    });

    console.log('Backend: Formatted procedures:', formattedProcedures.length); // Debug log
    console.log('Backend: Sending response'); // Debug log
    res.json(formattedProcedures);
  } catch (error) {
    console.error("Error fetching report procedures:", error);
    console.error("Backend error details:", error); // Debug log
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
    console.error("Error saving report procedures:", error);
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
    console.error("Error fetching workstation procedures:", error);
    res.status(500).json({ error: "Failed to fetch workstation procedures" });
  }
};
