import { prisma } from "../config/database";

export const getArchivedReports = async (
  userRole: string | undefined,
  userLabId: number | null | undefined,
  filters: {
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  },
) => {
  const where: any = { status: "Approved" };

  if (userRole === "Custodian") {
    where.lab_id = userLabId;
  }

  if (filters.start_date && filters.end_date) {
    where.report_date = {
      gte: new Date(filters.start_date),
      lte: new Date(filters.end_date),
    };
  }

  const pageNum = filters.page || 1;
  const limitNum = filters.limit || 10;
  const skip = (pageNum - 1) * limitNum;

  const totalCount = await prisma.daily_reports.count({ where });

  const reports = await prisma.daily_reports.findMany({
    where,
    include: {
      users: { select: { user_id: true, full_name: true, email: true } },
      laboratories: {
        select: { lab_id: true, lab_name: true, location: true },
      },
      report_workstation_items: {
        include: {
          workstations: {
            select: { workstation_id: true, workstation_name: true },
          },
        },
      },
      daily_report_procedures: {
        include: {
          procedures: {
            select: {
              procedure_id: true,
              procedure_name: true,
              category: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
    skip,
    take: limitNum,
  });

  const totalPages = Math.ceil(totalCount / limitNum);

  return {
    reports,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
    },
  };
};

export const getAllDailyReports = async (
  userRole: string | undefined,
  userLabId: number | null | undefined,
  filters: {
    lab_id?: number;
    user_id?: number;
    status?: string;
    exclude_status?: string;
    start_date?: string;
    end_date?: string;
  },
) => {
  const where: any = {};

  if (userRole === "Admin") {
    if (filters.lab_id) where.lab_id = filters.lab_id;
    if (filters.user_id) where.user_id = filters.user_id;
  } else {
    where.lab_id = userLabId;
    if (filters.lab_id && filters.lab_id !== userLabId) {
      throw new Error(
        "FORBIDDEN: You can only access reports from your assigned laboratory",
      );
    }
  }

  if (filters.status) where.status = filters.status;
  if (filters.exclude_status) where.status = { not: filters.exclude_status };
  if (filters.start_date && filters.end_date) {
    where.report_date = {
      gte: new Date(filters.start_date),
      lte: new Date(filters.end_date),
    };
  }

  return prisma.daily_reports.findMany({
    where,
    include: {
      users: { select: { user_id: true, full_name: true, email: true } },
      laboratories: {
        select: { lab_id: true, lab_name: true, location: true },
      },
    },
    orderBy: { created_at: "desc" },
  });
};

export const getDailyReportById = async (
  reportId: number,
  userRole?: string,
  userLabId?: number | null,
) => {
  const report = await prisma.daily_reports.findUnique({
    where: { report_id: reportId },
    include: {
      users: { select: { user_id: true, full_name: true, email: true } },
      laboratories: {
        select: { lab_id: true, lab_name: true, location: true },
      },
    },
  });

  if (!report) throw new Error("NOT_FOUND: Daily report not found");

  if (userRole !== "Admin" && report.lab_id !== userLabId) {
    throw new Error(
      "FORBIDDEN: You can only access reports from your assigned laboratory",
    );
  }

  const [workstationItems, reportProcedures] = await Promise.all([
    prisma.report_workstation_items.findMany({
      where: { report_id: reportId },
    }),
    prisma.daily_report_procedures.findMany({ where: { report_id: reportId } }),
  ]);

  const workstationIds = workstationItems.map((item) => item.workstation_id);
  const workstationDetails =
    workstationIds.length > 0
      ? await prisma.workstations.findMany({
          where: { workstation_id: { in: workstationIds } },
          select: { workstation_id: true, workstation_name: true },
        })
      : [];
  const workstationMap = new Map(
    workstationDetails.map((ws) => [ws.workstation_id, ws]),
  );

  const procedureIds = reportProcedures.map((rp) => rp.procedure_id);
  const procedureDetails =
    procedureIds.length > 0
      ? await prisma.procedures.findMany({
          where: { procedure_id: { in: procedureIds } },
          select: { procedure_id: true, procedure_name: true, category: true },
        })
      : [];
  const procedureMap = new Map(
    procedureDetails.map((p) => [p.procedure_id, p]),
  );

  return {
    ...report,
    workstation_items: workstationItems.map((item: any) => {
      const ws = workstationMap.get(item.workstation_id);
      return {
        workstation_id: item.workstation_id,
        workstation_name: ws?.workstation_name || "Unknown",
        status: item.status || "Working",
        remarks: item.remarks || null,
      };
    }),
    procedures: reportProcedures.map((rp: any) => {
      const procedure = procedureMap.get(rp.procedure_id);
      return {
        procedure_id: rp.procedure_id,
        procedure_name: procedure?.procedure_name || "Unknown Procedure",
        category: procedure?.category || null,
        overall_status: rp.overall_status || "Pending",
        overall_remarks: rp.overall_remarks || null,
        checklists: [],
      };
    }),
  };
};

export const createDailyReport = async (
  userId: number,
  userRole: string | undefined,
  data: any,
) => {
  if (userRole !== "Admin") {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { lab_id: true },
    });
    if (!user?.lab_id || user.lab_id !== data.lab_id) {
      throw new Error(
        "FORBIDDEN: You can only create reports for your assigned laboratory",
      );
    }
  }

  const existingReports = await prisma.daily_reports.count({
    where: {
      user_id: userId,
      lab_id: data.lab_id,
      report_date: new Date(data.report_date),
    },
  });

  if (existingReports >= 10) {
    throw new Error("Maximum 10 reports allowed per day for each laboratory");
  }

  return prisma.daily_reports.create({
    data: {
      user_id: userId,
      lab_id: data.lab_id,
      report_date: new Date(data.report_date),
      general_remarks: data.general_remarks,
      status: "Pending",
    },
    include: {
      users: { select: { user_id: true, full_name: true, email: true } },
      laboratories: {
        select: { lab_id: true, lab_name: true, location: true },
      },
    },
  });
};

export const updateDailyReport = async (
  reportId: number,
  userId: number,
  userRole: string | undefined,
  data: any,
) => {
  const existingReport = await prisma.daily_reports.findUnique({
    where: { report_id: reportId },
  });
  if (!existingReport) throw new Error("NOT_FOUND: Daily report not found");

  if (userRole !== "Admin" && existingReport.user_id !== userId) {
    throw new Error("FORBIDDEN: Not authorized to update this report");
  }

  if (userRole !== "Admin" && data.status === "Approved") {
    throw new Error("FORBIDDEN: Only Admin can approve reports");
  }

  const validStatuses = ["Pending", "Approved"];
  if (data.status && !validStatuses.includes(data.status)) {
    throw new Error("Invalid status. Valid statuses are: Pending, Approved");
  }

  return prisma.daily_reports.update({
    where: { report_id: reportId },
    data: {
      general_remarks:
        data.general_remarks !== undefined
          ? data.general_remarks
          : existingReport.general_remarks,
      status: data.status || existingReport.status,
    },
    include: {
      users: { select: { user_id: true, full_name: true, email: true } },
      laboratories: {
        select: { lab_id: true, lab_name: true, location: true },
      },
    },
  });
};

export const deleteDailyReport = async (reportId: number) => {
  const existingReport = await prisma.daily_reports.findUnique({
    where: { report_id: reportId },
  });
  if (!existingReport) throw new Error("NOT_FOUND: Daily report not found");

  await prisma.daily_reports.delete({ where: { report_id: reportId } });
  return { message: "Daily report deleted successfully" };
};
