// Enhanced dashboard controller for admin analytics - Optimized with analytics_summary_view
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Enhanced dashboard analytics for admins - Uses analytics_summary_view for efficiency
export const getAdminAnalytics = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "Admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Time-based analytics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Use analytics_summary_view for aggregated data (replaces 15 separate queries)
    const viewSummaryData = await prisma.$queryRawUnsafe(`
      SELECT 
        entity_type,
        group_key,
        SUM(total_count) as total_count
      FROM analytics_summary_view 
      WHERE (date_group >= ? OR date_group IS NULL)
      GROUP BY entity_type, group_key
    `, thirtyDaysAgoStr) as any[];

    // Get detailed breakdowns from view
    const viewDetailedData = await prisma.$queryRawUnsafe(`
      SELECT 
        entity_type,
        group_key,
        date_group,
        lab_id,
        total_count
      FROM analytics_summary_view 
      WHERE (date_group >= ? OR date_group IS NULL)
      ORDER BY entity_type, date_group
    `, thirtyDaysAgoStr) as any[];

    // Process view data into required format
    const reportsByStatus = viewSummaryData.filter(d => d.entity_type === 'daily_reports').map(d => ({ status: d.group_key, _count: { report_id: Number(d.total_count) } }));
    const reportsByDay = viewDetailedData.filter(d => d.entity_type === 'daily_reports' && d.date_group).map(d => ({ report_date: d.date_group, _count: { report_id: Number(d.total_count) } }));
    const reportsByLab = viewDetailedData.filter(d => d.entity_type === 'daily_reports').map(d => ({ lab_id: d.lab_id, _count: { report_id: Number(d.total_count) } }));

    const complaintsByStatus = viewSummaryData.filter(d => d.entity_type === 'complaints').map(d => ({ status: d.group_key, _count: { complaint_id: Number(d.total_count) } }));
    const complaintsByDay = viewDetailedData.filter(d => d.entity_type === 'complaints' && d.date_group).map(d => ({ created_at: d.date_group, _count: { complaint_id: Number(d.total_count) } }));
    const complaintsByLab = viewDetailedData.filter(d => d.entity_type === 'complaints').map(d => ({ lab_id: d.lab_id, _count: { complaint_id: Number(d.total_count) } }));

    const maintenanceByQuarter = viewSummaryData.filter(d => d.entity_type === 'pmc_reports').map(d => ({ quarter: d.group_key, _count: { pmc_id: Number(d.total_count) } }));
    const maintenanceByLab = viewDetailedData.filter(d => d.entity_type === 'pmc_reports').map(d => ({ lab_id: d.lab_id, _count: { pmc_id: Number(d.total_count) } }));

    // Get remaining data via Prisma (not in view)
    const [
      formsByType,
      formsByStatus,
      formsByDay,
      assetsByLab,
      assetsByType,
      assetsByStatus,
      usersByRole,
      usersByLab,
      maintenanceCompletionRate,
    ] = await Promise.all([
      // Forms by Type (Software Installations only)
      prisma.$transaction(async (tx) => {
        const softwareInstallations = await tx.software_installations.count();
        return [{ type: "Software Installations", count: softwareInstallations }];
      }),

      // Forms by Status (Software Installations only)
      prisma.$transaction(async (tx) => {
        const [softPending, softApproved, softDenied] = await Promise.all([
          tx.software_installations.count({ where: { status: "Pending" } }),
          tx.software_installations.count({ where: { status: "Custodian_Approved" } }),
          tx.software_installations.count({ where: { status: "Denied" } }),
        ]);
        return [
          { type: "Software - Pending", count: softPending },
          { type: "Software - Approved", count: softApproved },
          { type: "Software - Denied", count: softDenied },
        ];
      }),

      // Forms by Day (last 30 days)
      prisma.$transaction(async (tx) => {
        const softwareByDay = await tx.software_installations.groupBy({
          by: ["created_at"],
          _count: { software_list: true },
          where: { created_at: { gte: thirtyDaysAgo } },
        });
        return { softwareByDay };
      }),

      // Assets by Lab (all time)
      prisma.inventory_assets.groupBy({ by: ["lab_id"], _count: { asset_id: true } }),

      // Assets by Type
      prisma.units.groupBy({ by: ["device_type_id"], _count: { unit_id: true } }),

      // Assets by Status
      prisma.asset_details.groupBy({ by: ["status_id"], _count: { detail_id: true } }),

      // Users by Role
      prisma.users.groupBy({ by: ["role"], _count: { user_id: true } }),

      // Users by Lab
      prisma.users.groupBy({ by: ["lab_id"], _count: { user_id: true }, where: { lab_id: { not: null } } }),

      // Maintenance Completion Rate
      prisma.pmc_reports.aggregate({ _count: { pmc_id: true }, where: { overall_remarks: { not: null } } }),
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
      where: { lab_id: { in: allLabIds as number[] } },
      select: { lab_id: true, lab_name: true },
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
        byDay: { softwareByDay: formsByDay.softwareByDay },
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
