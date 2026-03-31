//backend/src/controllers/inventoryAnalyticsController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get inventory analytics data
export const getInventoryAnalytics = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    const userLabId = req.user?.lab_id;

    // Allow both admins and custodians to access inventory analytics
    if (userRole !== "Admin" && userRole !== "Custodian") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin or Custodian only." });
    }

    // Get user's lab information if they're a custodian
    let userLab = null;
    if (userRole === "Custodian" && userLabId) {
      userLab = await prisma.laboratories.findUnique({
        where: { lab_id: userLabId },
        select: { lab_id: true, lab_name: true },
      });
    }

    // Get all asset statuses
    const assetStatuses = await prisma.asset_statuses.findMany({
      orderBy: { status_name: "asc" },
    });

    // Find the "Disposed" status ID
    const disposedStatus = assetStatuses.find(status => status.status_name === "Disposed");
    const disposedStatusId = disposedStatus?.status_id;

    // Build where clause for status distribution (exclude only disposed assets, keep for disposal)
    const statusWhereClause: any = {
      status_id: {
        not: null,
        notIn: disposedStatusId ? [disposedStatusId] : undefined, // Exclude only disposed assets
      },
    };

    // If custodian, filter by their assigned lab
    if (userRole === "Custodian") {
      if (userLabId) {
        statusWhereClause.inventory_assets = {
          some: {
            lab_id: userLabId,
          },
        };
      } else {
        // Unassigned custodians should see nothing
        statusWhereClause.inventory_assets = {
          some: {
            lab_id: -1, // Impossible lab_id that will return no results
          },
        };
      }
    }

    // Get status distribution (filtered for custodians)
    let statusDistribution: any;
    if (userRole === "Custodian") {
      if (userLabId) {
        // For custodians, get assets from their assigned lab (excluding disposed)
        const labAssets = await prisma.inventory_assets.findMany({
          where: {
            lab_id: userLabId,
            asset_details: {
              status_id: {
                not: null,
                notIn: disposedStatusId ? [disposedStatusId] : undefined, // Exclude disposed assets
              },
            },
          },
          select: {
            asset_details: {
              select: {
                status_id: true,
              },
            },
          },
        });

        // Group by status_id and count
        const statusCounts = labAssets.reduce((acc: any, asset) => {
          const statusId = asset.asset_details?.status_id;
          if (statusId) {
            acc[statusId] = (acc[statusId] || 0) + 1;
          }
          return acc;
        }, {});

        // Convert to groupBy format
        statusDistribution = Object.entries(statusCounts).map(
          ([status_id, count]) => ({
            status_id: parseInt(status_id),
            _count: { asset_id: count as number },
          })
        );
      } else {
        // Unassigned custodians should see nothing
        statusDistribution = [];
      }
    } else {
      // For admins, use the original groupBy query
      statusDistribution = await prisma.asset_details.groupBy({
        by: ["status_id"],
        _count: {
          asset_id: true,
        },
        where: statusWhereClause,
      });
    }

    // Calculate total assets for percentage calculation
    const totalAssets = statusDistribution.reduce(
      (sum: number, status: any) => sum + status._count.asset_id,
      0
    );

    // Format status distribution with names and percentages
    const formattedStatusDistribution = statusDistribution.map(
      (status: any) => {
        const statusInfo = assetStatuses.find(
          (s) => s.status_id === status.status_id
        );
        return {
          status_name: statusInfo?.status_name || "Unknown",
          count: status._count.asset_id,
          percentage:
            totalAssets > 0
              ? Math.round((status._count.asset_id / totalAssets) * 100)
              : 0,
        };
      }
    );

    // Get assets by laboratory with status breakdown
    let labStatusData: any;
    if (userRole === "Custodian") {
      if (userLabId) {
        // For custodians, only get their assigned lab
        labStatusData = await prisma.laboratories.findMany({
          where: {
            lab_id: userLabId,
          },
          select: {
            lab_id: true,
            lab_name: true,
            inventory_assets: {
              select: {
                asset_details: {
                  select: {
                    status_id: true,
                  },
                },
              },
              where: {
                asset_details: {
                  status_id: {
                    not: null,
                    notIn: disposedStatusId ? [disposedStatusId] : undefined, // Exclude disposed assets
                  },
                },
              },
            },
            workstations: {
              select: {
                workstation_name: true,
                status_id: true,
                asset_statuses: {
                  select: {
                    status_name: true,
                  },
                },
              },
            },
          },
        });
      } else {
        // Unassigned custodians should see nothing
        labStatusData = [];
      }
    } else {
      // For admins, get all labs with status filtering
      labStatusData = await prisma.laboratories.findMany({
        select: {
          lab_id: true,
          lab_name: true,
          inventory_assets: {
            select: {
              asset_details: {
                select: {
                  status_id: true,
                },
              },
            },
            where: {
              asset_details: {
                status_id: {
                  not: null,
                  notIn: disposedStatusId ? [disposedStatusId] : undefined, // Exclude disposed assets
                },
              },
            },
          },
          workstations: {
            select: {
              workstation_name: true,
              status_id: true,
              asset_statuses: {
                select: {
                  status_name: true,
                },
              },
            },
          },
        },
      });
    }

    // Process lab status data
    const processedLabData = labStatusData
      .map((lab: any) => {
        const statusCounts: Record<string, number> = {};
        let totalAssets = 0;
        let totalWorkstations = 0;
        let functionalWorkstations = 0;
        let servicedWorkstations = 0;

        // Count assets by status for this lab
        lab.inventory_assets.forEach((asset: any) => {
          if (asset.asset_details?.status_id) {
            const statusId = asset.asset_details.status_id;
            const statusName =
              assetStatuses.find((s: any) => s.status_id === statusId)
                ?.status_name || "Unknown";
            statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
            totalAssets++;
          }
        });

        // Count workstations by status for this lab
        lab.workstations?.forEach((workstation: any) => {
          if (workstation.status_id) {
            const statusId = workstation.status_id;
            const statusName =
              assetStatuses.find((s: any) => s.status_id === statusId)
                ?.status_name || "Unknown";

            if (statusName === "Functional") {
              functionalWorkstations++;
            } else if (statusName !== "Unknown") {
              servicedWorkstations++;
            }

            totalWorkstations++;
          }
        });

        // Create standardized data structure
        const labData: any = {
          lab_id: lab.lab_id,
          lab_name: lab.lab_name,
          total: totalAssets,
          Functional: statusCounts["Functional"] || 0,
          "For Replacement": statusCounts["For Replacement"] || 0,
          "For Disposal": statusCounts["For Disposal"] || 0,
          Lost: statusCounts["Lost"] || 0,
          totalWorkstations: totalWorkstations,
          functionalWorkstations: functionalWorkstations,
          servicedWorkstations: servicedWorkstations,
        };

        return labData;
      })
      .filter((lab: any) => lab.total > 0); // Only include labs with assets

    // Get all workstations to ensure complete coverage
    let allWorkstations: any;
    if (userRole === "Custodian") {
      if (userLabId) {
        // For custodians, get workstations from their assigned lab
        allWorkstations = await prisma.workstations.findMany({
          where: {
            lab_id: userLabId,
          },
          select: {
            workstation_name: true,
            lab_id: true,
            asset_statuses: {
              select: {
                status_name: true,
              },
            },
          },
        });
      } else {
        // Unassigned custodians should see nothing
        allWorkstations = [];
      }
    } else {
      // For admins, get all workstations
      allWorkstations = await prisma.workstations.findMany({
        select: {
          workstation_name: true,
          lab_id: true,
          laboratories: {
            select: {
              lab_name: true,
            },
          },
          asset_statuses: {
            select: {
              status_name: true,
            },
          },
        },
      });
    }

    // Get assets with purchase dates for timeline (remove limit to get all assets)
    let assetsWithPurchaseDates;
    if (userRole === "Custodian") {
      // For custodians, get assets from their assigned lab
      assetsWithPurchaseDates = await prisma.inventory_assets.findMany({
        where: {
          lab_id: userLabId,
          asset_details: {
            date_of_purchase: {
              not: null,
            },
            status_id: {
              not: null,
              notIn: disposedStatusId ? [disposedStatusId] : undefined, // Exclude disposed assets
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
          units: {
            select: {
              unit_name: true,
            },
          },
          workstations: {
            select: {
              workstation_name: true,
              asset_statuses: {
                select: {
                  status_name: true,
                },
              },
            },
          },
          laboratories: {
            select: {
              lab_name: true,
            },
          },
        },
        orderBy: {
          asset_details: {
            date_of_purchase: "desc",
          },
        },
      });
    } else {
      // For admins, get all assets with simplified query
      assetsWithPurchaseDates = await prisma.inventory_assets.findMany({
        where: {
          asset_details: {
            date_of_purchase: {
              not: null,
            },
            status_id: {
              not: null,
              notIn: disposedStatusId ? [disposedStatusId] : undefined, // Exclude disposed assets
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
          units: {
            select: {
              unit_name: true,
            },
          },
          workstations: {
            select: {
              workstation_name: true,
              asset_statuses: {
                select: {
                  status_name: true,
                },
              },
            },
          },
          laboratories: {
            select: {
              lab_name: true,
            },
          },
        },
        orderBy: {
          asset_details: {
            date_of_purchase: "desc",
          },
        },
      });
    }

    // Process timeline data to include all workstations
    const timelineData = [];

    // First, add all assets to timeline data
    const assetTimelineData = assetsWithPurchaseDates.map((asset) => ({
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
      current_age_years: asset.asset_details?.date_of_purchase
        ? Math.max(
            0,
            Math.floor(
              (new Date().getTime() -
                new Date(asset.asset_details.date_of_purchase).getTime()) /
                (1000 * 60 * 60 * 24 * 365.25)
            )
          )
        : 0,
      timeline_position: asset.asset_details?.date_of_purchase
        ? (() => {
            const age =
              (new Date().getTime() -
                new Date(asset.asset_details.date_of_purchase).getTime()) /
              (1000 * 60 * 60 * 24 * 365.25);
            let position;

            // Exact year counting based on completed years
            if (age < 1) position = 0; // Y1: 0-1 years old
            else if (age < 1.5) position = 1; // Y1: exactly 1 year old
            else if (age < 2.5) position = 2; // Y2: exactly 2 years old
            else if (age < 3.5) position = 3; // Y3: exactly 3 years old
            else if (age < 4.5) position = 4; // Y4: exactly 4 years old
            else position = 5; // Y5: 5+ years old

            return position;
          })()
        : 0,
      workstation_status:
        asset.workstations?.asset_statuses?.status_name || "Unknown",
    }));

    timelineData.push(...assetTimelineData);

    // Then, add workstations without assets as placeholder entries
    const workstationNamesWithAssets = new Set(
      assetTimelineData
        .map((asset) => asset.workstation_name)
        .filter((name) => name && name !== "Not Assigned")
    );

    // Create placeholder entries for workstations without assets
    allWorkstations.forEach((workstation: any) => {
      if (!workstationNamesWithAssets.has(workstation.workstation_name)) {
        timelineData.push({
          asset_id: 0, // Use 0 as placeholder ID for workstations without assets
          lab_id: workstation.lab_id,
          asset_name: "No Assets",
          unit_name: "",
          workstation_name: workstation.workstation_name,
          lab_name:
            (workstation as any).laboratories?.lab_name || "Not Assigned",
          purchase_date: new Date().toISOString(), // Current date as placeholder
          current_age_years: 0,
          timeline_position: 0,
          workstation_status:
            workstation.asset_statuses?.status_name || "Unknown",
        });
      }
    });

    // Calculate summary statistics
    const summary = {
      totalAssets: totalAssets,
      functionalAssets:
        formattedStatusDistribution.find(
          (s: any) => s.status_name === "Functional"
        )?.count || 0,
      needsAttention:
        (formattedStatusDistribution.find(
          (s: any) => s.status_name === "For Replacement"
        )?.count || 0) +
        (formattedStatusDistribution.find(
          (s: any) => s.status_name === "For Disposal"
        )?.count || 0),
      criticalAssets:
        formattedStatusDistribution.find((s: any) => s.status_name === "Lost")
          ?.count || 0,
    };

    const analyticsData = {
      statusDistribution: formattedStatusDistribution,
      labStatusData: processedLabData,
      summary,
      timelineData,
    };

    res.json(analyticsData);
  } catch (error) {
    console.error("Error fetching inventory analytics:", error);
    res.status(500).json({ error: "Failed to fetch inventory analytics" });
  }
};
