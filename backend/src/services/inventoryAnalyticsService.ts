import { prisma } from "../config/database";

export const getInventoryAnalyticsData = async (
  userRole?: string,
  userId?: number,
  userLabId?: number | null,
) => {
  // 1. Authorization Check
  if (userRole !== "Admin" && userRole !== "Custodian") {
    throw new Error("FORBIDDEN: Access denied. Admin or Custodian only.");
  }

  // 2. Fetch Base Data (Statuses)
  const assetStatuses = await prisma.asset_statuses.findMany({
    orderBy: { status_name: "asc" },
  });
  const disposedStatus = assetStatuses.find(
    (status) => status.status_name === "Disposed",
  );
  const disposedStatusId = disposedStatus?.status_id;

  // Build where clause for status distribution
  const statusWhereClause: any = {
    status_id: {
      not: null,
      notIn: disposedStatusId ? [disposedStatusId] : undefined,
    },
  };

  if (userRole === "Custodian") {
    statusWhereClause.inventory_assets = { some: { lab_id: userLabId || -1 } };
  }

  // 3. Get Status Distribution
  let statusDistribution: any;
  if (userRole === "Custodian" && userLabId) {
    const labAssets = await prisma.inventory_assets.findMany({
      where: {
        lab_id: userLabId,
        asset_details: {
          status_id: {
            not: null,
            notIn: disposedStatusId ? [disposedStatusId] : undefined,
          },
        },
      },
      select: { asset_details: { select: { status_id: true } } },
    });

    const statusCounts = labAssets.reduce((acc: any, asset) => {
      const statusId = asset.asset_details?.status_id;
      if (statusId) acc[statusId] = (acc[statusId] || 0) + 1;
      return acc;
    }, {});

    statusDistribution = Object.entries(statusCounts).map(
      ([status_id, count]) => ({
        status_id: parseInt(status_id),
        _count: { asset_id: count as number },
      }),
    );
  } else if (userRole === "Admin") {
    statusDistribution = await prisma.asset_details.groupBy({
      by: ["status_id"],
      _count: { asset_id: true },
      where: statusWhereClause,
    });
  } else {
    statusDistribution = [];
  }

  const totalAssets = statusDistribution.reduce(
    (sum: number, status: any) => sum + status._count.asset_id,
    0,
  );

  const formattedStatusDistribution = statusDistribution.map((status: any) => {
    const statusInfo = assetStatuses.find(
      (s) => s.status_id === status.status_id,
    );
    return {
      status_name: statusInfo?.status_name || "Unknown",
      count: status._count.asset_id,
      percentage:
        totalAssets > 0
          ? Math.round((status._count.asset_id / totalAssets) * 100)
          : 0,
    };
  });

  // 4. Get Lab Status Data
  let labStatusData: any;
  if (userRole === "Custodian" && userLabId) {
    labStatusData = await prisma.laboratories.findMany({
      where: { lab_id: userLabId },
      select: {
        lab_id: true,
        lab_name: true,
        inventory_assets: {
          select: { asset_details: { select: { status_id: true } } },
          where: {
            asset_details: {
              status_id: {
                not: null,
                notIn: disposedStatusId ? [disposedStatusId] : undefined,
              },
            },
          },
        },
        workstations: {
          select: {
            workstation_name: true,
            status_id: true,
            asset_statuses: { select: { status_name: true } },
          },
        },
      },
    });
  } else if (userRole === "Admin") {
    labStatusData = await prisma.laboratories.findMany({
      select: {
        lab_id: true,
        lab_name: true,
        inventory_assets: {
          select: { asset_details: { select: { status_id: true } } },
          where: {
            asset_details: {
              status_id: {
                not: null,
                notIn: disposedStatusId ? [disposedStatusId] : undefined,
              },
            },
          },
        },
        workstations: {
          select: {
            workstation_name: true,
            status_id: true,
            asset_statuses: { select: { status_name: true } },
          },
        },
      },
    });
  } else {
    labStatusData = [];
  }

  const processedLabData = labStatusData
    .map((lab: any) => {
      const statusCounts: Record<string, number> = {};
      let labTotalAssets = 0,
        totalWorkstations = 0,
        functionalWorkstations = 0,
        servicedWorkstations = 0;

      lab.inventory_assets.forEach((asset: any) => {
        if (asset.asset_details?.status_id) {
          const statusName =
            assetStatuses.find(
              (s: any) => s.status_id === asset.asset_details.status_id,
            )?.status_name || "Unknown";
          statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
          labTotalAssets++;
        }
      });

      lab.workstations?.forEach((workstation: any) => {
        if (workstation.status_id) {
          const statusName =
            assetStatuses.find(
              (s: any) => s.status_id === workstation.status_id,
            )?.status_name || "Unknown";
          if (statusName === "Functional") functionalWorkstations++;
          else if (statusName !== "Unknown") servicedWorkstations++;
          totalWorkstations++;
        }
      });

      return {
        lab_id: lab.lab_id,
        lab_name: lab.lab_name,
        total: labTotalAssets,
        Functional: statusCounts["Functional"] || 0,
        "For Replacement": statusCounts["For Replacement"] || 0,
        "For Disposal": statusCounts["For Disposal"] || 0,
        Lost: statusCounts["Lost"] || 0,
        totalWorkstations,
        functionalWorkstations,
        servicedWorkstations,
      };
    })
    .filter((lab: any) => lab.total > 0);

  // 5. Get Timeline Data
  const allWorkstations = await prisma.workstations.findMany({
    where:
      userRole === "Custodian" && userLabId ? { lab_id: userLabId } : undefined,
    select: {
      workstation_name: true,
      lab_id: true,
      asset_statuses: { select: { status_name: true } },
      laboratories: { select: { lab_name: true } },
    },
  });

  const assetsWithPurchaseDates = await prisma.inventory_assets.findMany({
    where: {
      ...(userRole === "Custodian" && userLabId ? { lab_id: userLabId } : {}),
      asset_details: {
        date_of_purchase: { not: null },
        status_id: {
          not: null,
          notIn: disposedStatusId ? [disposedStatusId] : undefined,
        },
      },
    },
    select: {
      asset_id: true,
      lab_id: true,
      asset_details: {
        select: {
          date_of_purchase: true,
          description: true,
          property_tag_no: true,
        },
      },
      units: { select: { unit_name: true } },
      workstations: {
        select: {
          workstation_name: true,
          asset_statuses: { select: { status_name: true } },
        },
      },
      laboratories: { select: { lab_name: true } },
    },
    orderBy: { asset_details: { date_of_purchase: "desc" } },
  });

  const timelineData = assetsWithPurchaseDates.map((asset) => {
    const age = asset.asset_details?.date_of_purchase
      ? (new Date().getTime() -
          new Date(asset.asset_details.date_of_purchase).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25)
      : 0;

    let position = 0;
    if (age < 1) position = 0;
    else if (age < 1.5) position = 1;
    else if (age < 2.5) position = 2;
    else if (age < 3.5) position = 3;
    else if (age < 4.5) position = 4;
    else position = 5;

    return {
      asset_id: asset.asset_id,
      lab_id: asset.lab_id,
      asset_name:
        asset.asset_details?.description ||
        asset.units?.unit_name ||
        `Asset #${asset.asset_id}`,
      unit_name: asset.units?.unit_name || "",
      workstation_name: asset.workstations?.workstation_name || "Not Assigned",
      lab_name: asset.laboratories?.lab_name || "Not Assigned",
      purchase_date: asset.asset_details?.date_of_purchase?.toISOString() || "",
      current_age_years: Math.max(0, Math.floor(age)),
      timeline_position: position,
      workstation_status:
        asset.workstations?.asset_statuses?.status_name || "Unknown",
    };
  });

  const workstationNamesWithAssets = new Set(
    timelineData
      .map((asset) => asset.workstation_name)
      .filter((name) => name && name !== "Not Assigned"),
  );

  allWorkstations.forEach((workstation: any) => {
    if (!workstationNamesWithAssets.has(workstation.workstation_name)) {
      timelineData.push({
        asset_id: 0,
        lab_id: workstation.lab_id,
        asset_name: "No Assets",
        unit_name: "",
        workstation_name: workstation.workstation_name,
        lab_name: workstation.laboratories?.lab_name || "Not Assigned",
        purchase_date: new Date().toISOString(),
        current_age_years: 0,
        timeline_position: 0,
        workstation_status:
          workstation.asset_statuses?.status_name || "Unknown",
      });
    }
  });

  // 6. Summary Statistics
  const summary = {
    totalAssets: totalAssets,
    functionalAssets:
      formattedStatusDistribution.find(
        (s: any) => s.status_name === "Functional",
      )?.count || 0,
    needsAttention:
      (formattedStatusDistribution.find(
        (s: any) => s.status_name === "For Replacement",
      )?.count || 0) +
      (formattedStatusDistribution.find(
        (s: any) => s.status_name === "For Disposal",
      )?.count || 0),
    criticalAssets:
      formattedStatusDistribution.find((s: any) => s.status_name === "Lost")
        ?.count || 0,
  };

  return {
    statusDistribution: formattedStatusDistribution,
    labStatusData: processedLabData,
    summary,
    timelineData,
  };
};
