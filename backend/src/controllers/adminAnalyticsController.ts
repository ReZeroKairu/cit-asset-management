// Enhanced dashboard controller for admin analytics
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Enhanced dashboard analytics for admins
export const getAdminAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== "Admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Time-based analytics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      // Daily Reports Analytics
      reportsByStatus,
      reportsByDay,
      reportsByLab,

      // Forms Analytics
      formsByType,
      formsByStatus,
      formsByDay,

      // Complaints Analytics
      complaintsByStatus,
      complaintsByDay,
      complaintsByLab,

      // Asset Analytics
      assetsByLab,
      assetsByType,
      assetsByStatus,

      // User Analytics
      usersByRole,
      usersByLab,

      // Maintenance Analytics
      maintenanceByQuarter,
      maintenanceByLab,
      maintenanceCompletionRate,
    ] = await Promise.all([
      // Daily Reports by Status
      prisma.daily_reports.groupBy({
        by: ["status"],
        _count: { report_id: true },
        where: {
          report_date: { gte: thirtyDaysAgo },
        },
      }),

      // Daily Reports by Day (last 30 days)
      prisma.daily_reports.groupBy({
        by: ["report_date"],
        _count: { report_id: true },
        where: {
          report_date: { gte: thirtyDaysAgo },
        },
        orderBy: { report_date: "asc" },
      }),

      // Daily Reports by Lab
      prisma.daily_reports.groupBy({
        by: ["lab_id"],
        _count: { report_id: true },
        where: {
          report_date: { gte: thirtyDaysAgo },
        },
      }),

      // Forms by Type
      prisma.$transaction(async (tx) => {
        const labRequests = await tx.lab_requests.count();
        const equipmentBorrows = await tx.equipment_borrows.count();
        const softwareInstallations = await tx.software_installations.count();

        return [
          { type: "Lab Requests", count: labRequests },
          { type: "Equipment Borrows", count: equipmentBorrows },
          { type: "Software Installations", count: softwareInstallations },
        ];
      }),

      // Forms by Status
      prisma.$transaction(async (tx) => {
        const [labPending, labApproved, labDenied] = await Promise.all([
          tx.lab_requests.count({ where: { status: "Pending" } }),
          tx.lab_requests.count({ where: { status: "Admin_Approved" } }),
          tx.lab_requests.count({ where: { status: "Denied" } }),
        ]);

        const [equipPending, equipApproved, equipDenied] = await Promise.all([
          tx.equipment_borrows.count({ where: { status: "Pending" } }),
          tx.equipment_borrows.count({ where: { status: "Admin_Approved" } }),
          tx.equipment_borrows.count({ where: { status: "Denied" } }),
        ]);

        const [softPending, softApproved, softDenied] = await Promise.all([
          tx.software_installations.count({ where: { status: "Pending" } }),
          tx.software_installations.count({
            where: { status: "Admin_Approved" },
          }),
          tx.software_installations.count({ where: { status: "Denied" } }),
        ]);

        return [
          { type: "Lab Requests - Pending", count: labPending },
          { type: "Lab Requests - Approved", count: labApproved },
          { type: "Lab Requests - Denied", count: labDenied },
          { type: "Equipment - Pending", count: equipPending },
          { type: "Equipment - Approved", count: equipApproved },
          { type: "Equipment - Denied", count: equipDenied },
          { type: "Software - Pending", count: softPending },
          { type: "Software - Approved", count: softApproved },
          { type: "Software - Denied", count: softDenied },
        ];
      }),

      // Forms by Day (last 30 days)
      prisma.$transaction(async (tx) => {
        const labRequestsByDay = await tx.lab_requests.groupBy({
          by: ["created_at"],
          _count: { request_id: true },
          where: {
            created_at: { gte: thirtyDaysAgo },
          },
        });

        const equipmentByDay = await tx.equipment_borrows.groupBy({
          by: ["created_at"],
          _count: { borrow_id: true },
          where: {
            created_at: { gte: thirtyDaysAgo },
          },
        });

        const softwareByDay = await tx.software_installations.groupBy({
          by: ["created_at"],
          _count: { software_list: true },
          where: {
            created_at: { gte: thirtyDaysAgo },
          },
        });

        return { labRequestsByDay, equipmentByDay, softwareByDay };
      }),

      // Complaints by Status
      prisma.complaints.groupBy({
        by: ["status"],
        _count: { complaint_id: true },
        where: {
          created_at: { gte: thirtyDaysAgo },
        },
      }),

      // Complaints by Day
      prisma.complaints.groupBy({
        by: ["created_at"],
        _count: { complaint_id: true },
        where: {
          created_at: { gte: thirtyDaysAgo },
        },
        orderBy: { created_at: "asc" },
      }),

      // Complaints by Lab
      prisma.complaints.groupBy({
        by: ["lab_id"],
        _count: { complaint_id: true },
        where: {
          created_at: { gte: thirtyDaysAgo },
        },
      }),

      // Assets by Lab
      prisma.inventory_assets.groupBy({
        by: ["lab_id"],
        _count: { asset_id: true },
      }),

      // Assets by Type (via units table)
      prisma.units.groupBy({
        by: ["device_type_id"],
        _count: { unit_id: true },
      }),

      // Assets by Status (via asset_details table)
      prisma.asset_details.groupBy({
        by: ["status_id"],
        _count: { detail_id: true },
      }),

      // Users by Role
      prisma.users.groupBy({
        by: ["role"],
        _count: { user_id: true },
      }),

      // Users by Lab
      prisma.users.groupBy({
        by: ["lab_id"],
        _count: { user_id: true },
        where: {
          lab_id: { not: null },
        },
      }),

      // Maintenance by Quarter
      prisma.pmc_reports.groupBy({
        by: ["quarter"],
        _count: { pmc_id: true },
        orderBy: { quarter: "asc" },
      }),

      // Maintenance by Lab
      prisma.pmc_reports.groupBy({
        by: ["lab_id"],
        _count: { pmc_id: true },
      }),

      // Maintenance Completion Rate
      prisma.pmc_reports.aggregate({
        _count: {
          pmc_id: true,
        },
        where: {
          overall_remarks: { not: null },
        },
      }),
    ]);

    // Get lab names for all lab-based data
    const allLabIds = [
      ...reportsByLab.map((r) => r.lab_id),
      ...complaintsByLab.map((c) => c.lab_id),
      ...assetsByLab.map((a) => a.lab_id),
      ...usersByLab.map((u) => u.lab_id),
      ...maintenanceByLab.map((m) => m.lab_id),
    ].filter(Boolean);

    const labs = await prisma.laboratories.findMany({
      where: {
        lab_id: { in: allLabIds as number[] },
      },
      select: {
        lab_id: true,
        lab_name: true,
      },
    });

    const getLabName = (labId: number | null) => {
      const lab = labs.find((l) => l.lab_id === labId);
      return lab?.lab_name || "Unknown";
    };

    // Format data for charts
    const analyticsData = {
      reports: {
        byStatus: reportsByStatus.map((r) => ({
          name: r.status,
          value: r._count.report_id,
        })),
        byDay: reportsByDay.map((r) => ({
          date: r.report_date,
          count: r._count.report_id,
        })),
        byLab: reportsByLab.map((r) => ({
          lab: getLabName(r.lab_id),
          count: r._count.report_id,
        })),
      },
      forms: {
        byType: formsByType,
        byStatus: formsByStatus.map((f) => ({ name: f.type, value: f.count })),
        byDay: formsByDay,
      },
      complaints: {
        byStatus: complaintsByStatus.map((c) => ({
          name: c.status,
          value: c._count.complaint_id,
        })),
        byDay: complaintsByDay.map((c) => ({
          date: c.created_at,
          count: c._count.complaint_id,
        })),
        byLab: complaintsByLab.map((c) => ({
          lab: getLabName(c.lab_id),
          count: c._count.complaint_id,
        })),
      },
      assets: {
        byLab: assetsByLab.map((a) => ({
          lab: getLabName(a.lab_id),
          count: a._count.asset_id,
        })),
        byType: assetsByType.map((a) => ({
          type: `Device Type ${a.device_type_id}`,
          count: a._count.unit_id,
        })),
        byStatus: assetsByStatus.map((a) => ({
          status: `Status ${a.status_id}`,
          count: a._count.detail_id,
        })),
      },
      users: {
        byRole: usersByRole.map((u) => ({
          role: u.role,
          count: u._count.user_id,
        })),
        byLab: usersByLab.map((u) => ({
          lab: getLabName(u.lab_id),
          count: u._count.user_id,
        })),
      },
      maintenance: {
        byQuarter: maintenanceByQuarter.map((m) => ({
          quarter: m.quarter,
          count: m._count.pmc_id,
        })),
        byLab: maintenanceByLab.map((m) => ({
          lab: getLabName(m.lab_id),
          count: m._count.pmc_id,
        })),
        completionRate: {
          completed: maintenanceCompletionRate._count.pmc_id,
          total: await prisma.pmc_reports.count(),
        },
      },
    };

    res.json(analyticsData);
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};
