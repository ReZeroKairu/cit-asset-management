import { prisma } from "../config/database";

export const getDashboardOverview = async (
  userId?: number,
  userRole?: string,
) => {
  const assetStatuses = await prisma.asset_statuses.findMany({
    orderBy: { status_name: "asc" },
  });
  const disposedStatusId = assetStatuses.find(
    (s) => s.status_name === "Disposed",
  )?.status_id;

  // Helper function to resolve the user's Lab ID
  const getUserLabId = async () => {
    if (userRole === "Custodian" && userId) {
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { lab_id: true },
      });
      return user?.lab_id || null;
    }
    return null;
  };

  const userLabId = await getUserLabId();
  const labFilter = userLabId ? { lab_id: userLabId } : {};

  // Standardize the thirty days ago date
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalAssets,
    totalLaboratories,
    totalDailyReports,
    totalUsers,
    totalForms,
    pendingComplaints,
    openComplaints,
    inProgressComplaints,
  ] = await Promise.all([
    // Total Assets
    prisma.inventory_assets.count({
      where: {
        ...labFilter,
        asset_details: {
          status_id: {
            not: null,
            notIn: disposedStatusId ? [disposedStatusId] : undefined,
          },
        },
      },
    }),
    // Total Labs
    userRole === "Admin" ? prisma.laboratories.count() : Promise.resolve(0),
    // Total Daily Reports
    prisma.daily_reports.count({ where: { ...labFilter, status: "Pending" } }),
    // Total Users
    userRole === "Admin" ? prisma.users.count() : Promise.resolve(0),
    // Total Forms (Software Installations)
    prisma.software_installations.count({
      where:
        userRole === "Custodian"
          ? {
              user_id: userId,
              status: { in: ["Pending", "Custodian_Approved"] },
            }
          : { status: "Custodian_Approved" },
    }),
    // Complaints
    prisma.complaints.count({
      where: { ...labFilter, status: { in: ["Open", "In_Progress"] } },
    }),
    prisma.complaints.count({ where: { ...labFilter, status: "Open" } }),
    prisma.complaints.count({ where: { ...labFilter, status: "In_Progress" } }),
  ]);

  // Daily Lab Logs
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
  );

  let dailyLabLogs = 0;
  if (userRole === "Admin") {
    dailyLabLogs = await prisma.cit_lab_logs.count({
      where: { created_at: { gte: startOfDay, lt: endOfDay } },
    });
  } else if (userId) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: { laboratories: true },
    });
    if (user?.laboratories?.lab_name) {
      dailyLabLogs = await prisma.cit_lab_logs.count({
        where: {
          laboratory: user.laboratories.lab_name,
          created_at: { gte: startOfDay, lt: endOfDay },
        },
      });
    }
  }

  // Recent Reports
  const recentReports = await prisma.daily_reports.findMany({
    take: 5,
    where: { status: "Pending", ...labFilter },
    orderBy: { report_date: "desc" },
    include: {
      users: { select: { full_name: true } },
      laboratories: { select: { lab_name: true } },
    },
  });

  return {
    stats: {
      totalAssets,
      totalLaboratories,
      totalDailyReports,
      totalUsers,
      totalForms,
      totalComplaints: pendingComplaints,
      openComplaints,
      inProgressComplaints,
      dailyLabLogs,
    },
    recentReports,
    userRole,
  };
};
