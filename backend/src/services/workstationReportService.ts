import { prisma } from "../config/database";

export const getLabWorkstationsForReport = async (labId: number) => {
  const workstations = await prisma.workstations.findMany({
    where: { lab_id: labId },
    include: { asset_statuses: true },
    orderBy: { workstation_name: "asc" },
  });

  return workstations.map((ws) => ({
    workstation_id: ws.workstation_id,
    workstation_name: ws.workstation_name,
    workstation_remarks: ws.workstation_remarks ?? null,
    current_status: ws.asset_statuses ?? null,
    status: "Working",
    remarks: null,
    checked: false,
  }));
};

export const saveWorkstationChecklist = async (
  reportId: number,
  workstations: any[],
) => {
  if (!Array.isArray(workstations))
    throw new Error("VALIDATION: Workstations array is required");

  return prisma.$transaction(async (tx) => {
    await tx.report_workstation_items.deleteMany({
      where: { report_id: reportId },
    });

    const savedItems = await Promise.all(
      workstations.map((ws: any) =>
        tx.report_workstation_items.create({
          data: {
            report_id: reportId,
            workstation_id: ws.workstation_id,
            status: ws.status || "Working",
            remarks: ws.remarks || null,
          },
        }),
      ),
    );
    return savedItems;
  });
};

export const getWorkstationChecklist = async (reportId: number) => {
  return prisma.report_workstation_items.findMany({
    where: { report_id: reportId },
  });
};
