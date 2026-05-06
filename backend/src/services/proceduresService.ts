// src/services/proceduresService.ts
import { prisma } from "../config/database";

export const getAllProcedures = async () => {
  return prisma.procedures.findMany({
    where: { is_active: true },
    orderBy: { procedure_name: "asc" },
  });
};

export const getReportProcedures = async (reportId: number) => {
  const reportProcedures = await prisma.daily_report_procedures.findMany({
    where: { report_id: reportId },
  });

  const procedureIds = reportProcedures.map((rp) => rp.procedure_id);

  const procedures = await prisma.procedures.findMany({
    where: { procedure_id: { in: procedureIds } },
  });

  return procedures.map((procedure) => ({
    procedure_id: procedure.procedure_id,
    procedure_name: procedure.procedure_name,
    procedure_description: "",
    category: procedure.category || "",
    is_checked: reportProcedures.some(
      (rp) => rp.procedure_id === procedure.procedure_id,
    ),
  }));
};

export const saveReportProcedures = async (
  reportId: number,
  procedures: any[],
) => {
  if (!Array.isArray(procedures)) {
    throw new Error("VALIDATION: Procedures must be an array");
  }

  return prisma.$transaction(async (tx) => {
    await tx.daily_report_procedures.deleteMany({
      where: { report_id: reportId },
    });

    const savedProcedures = await Promise.all(
      procedures.map(async (proc: any) => {
        return tx.daily_report_procedures.create({
          data: {
            report_id: reportId,
            procedure_id: proc.procedure_id,
            overall_status: proc.overall_status || "Pending",
            overall_remarks: proc.overall_remarks || null,
          },
        });
      }),
    );
    return savedProcedures;
  });
};

export const getWorkstationProcedures = async () => {
  return prisma.procedures.findMany({
    where: {
      is_active: true,
      category: {
        in: ["Hardware", "Software", "Network", "Security", "Maintenance"],
      },
    },
    orderBy: { procedure_name: "asc" },
  });
};
