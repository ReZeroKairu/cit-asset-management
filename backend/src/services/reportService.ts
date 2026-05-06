import { prisma } from "../config/database";

export const getReportData = async (filters: {
  lab_id?: number;
  start_date?: string;
  end_date?: string;
}) => {
  const where: any = {};

  if (filters.lab_id) where.lab_id = filters.lab_id;
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
    orderBy: { report_date: "desc" },
  });
};
