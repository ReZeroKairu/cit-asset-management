//backend/src/controllers/inventoryAnalyticsController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get inventory analytics data
export const getInventoryAnalytics = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;

    // Only allow admins to access inventory analytics
    if (userRole !== "Admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    // Get all asset statuses
    const assetStatuses = await prisma.asset_statuses.findMany({
      orderBy: { status_name: 'asc' }
    });

    // Get status distribution across all assets
    const statusDistribution = await prisma.asset_details.groupBy({
      by: ['status_id'],
      _count: {
        asset_id: true
      },
      where: {
        status_id: {
          not: null
        }
      }
    });

    // Calculate total assets for percentage calculation
    const totalAssets = statusDistribution.reduce((sum, status) => sum + status._count.asset_id, 0);

    // Format status distribution with names and percentages
    const formattedStatusDistribution = statusDistribution.map(status => {
      const statusInfo = assetStatuses.find(s => s.status_id === status.status_id);
      return {
        status_name: statusInfo?.status_name || 'Unknown',
        count: status._count.asset_id,
        percentage: totalAssets > 0 ? Math.round((status._count.asset_id / totalAssets) * 100) : 0
      };
    });

    // Get assets by laboratory with status breakdown
    const labStatusData = await prisma.laboratories.findMany({
      select: {
        lab_id: true,
        lab_name: true,
        inventory_assets: {
          select: {
            asset_details: {
              select: {
                status_id: true
              }
            }
          }
        }
      },
      where: {
        inventory_assets: {
          some: {
            asset_details: {
              status_id: {
                not: null
              }
            }
          }
        }
      }
    });

    // Process lab status data
    const processedLabData = labStatusData.map(lab => {
      const statusCounts: Record<string, number> = {};
      let totalAssets = 0;

      // Count assets by status for this lab
      lab.inventory_assets.forEach(asset => {
        if (asset.asset_details?.status_id) {
          const statusId = asset.asset_details.status_id;
          const statusName = assetStatuses.find(s => s.status_id === statusId)?.status_name || 'Unknown';
          statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
          totalAssets++;
        }
      });

      // Create the standardized data structure
      const labData: any = {
        lab_name: lab.lab_name,
        total: totalAssets,
        Functional: statusCounts['Functional'] || 0,
        "For Replacement": statusCounts['For Replacement'] || 0,
        "For Repair": statusCounts['For Repair'] || 0,
        "For Upgrade": statusCounts['For Upgrade'] || 0,
        Lost: statusCounts['Lost'] || 0
      };

      return labData;
    }).filter(lab => lab.total > 0); // Only include labs with assets

    // Get assets with purchase dates for timeline
    const assetsWithPurchaseDates = await prisma.inventory_assets.findMany({
      select: {
        asset_id: true,
        asset_details: {
          select: {
            date_of_purchase: true,
            description: true,
            property_tag_no: true
          }
        },
        units: {
          select: {
            unit_name: true
          }
        },
        workstations: {
          select: {
            workstation_name: true
          }
        },
        laboratories: {
          select: {
            lab_name: true
          }
        }
      },
      where: {
        asset_details: {
          date_of_purchase: {
            not: null
          },
          status_id: {
            not: null
          }
        }
      },
      orderBy: {
        asset_details: {
          date_of_purchase: 'desc'
        }
      },
      take: 50 // Limit to recent 50 assets for timeline
    });

    // Process timeline data
    const timelineData = assetsWithPurchaseDates.map(asset => ({
      asset_id: asset.asset_id,
      asset_name: asset.asset_details?.description || asset.units?.unit_name || `Asset #${asset.asset_id}`,
      unit_name: asset.units?.unit_name || '',
      workstation_name: asset.workstations?.workstation_name || 'Not Assigned',
      lab_name: asset.laboratories?.lab_name || 'Not Assigned',
      purchase_date: asset.asset_details?.date_of_purchase?.toISOString() || '',
      current_age_years: asset.asset_details?.date_of_purchase
        ? Math.floor((new Date().getTime() - new Date(asset.asset_details.date_of_purchase).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : 0,
      timeline_position: asset.asset_details?.date_of_purchase
        ? Math.min(Math.max(Math.floor((new Date().getTime() - new Date(asset.asset_details.date_of_purchase).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) + 1, 1), 5)
        : 1
    }));

    // Calculate summary statistics
    const summary = {
      totalAssets: totalAssets,
      functionalAssets: formattedStatusDistribution.find(s => s.status_name === 'Functional')?.count || 0,
      needsAttention: (formattedStatusDistribution.find(s => s.status_name === 'For Replacement')?.count || 0) +
                       (formattedStatusDistribution.find(s => s.status_name === 'For Repair')?.count || 0),
      criticalAssets: formattedStatusDistribution.find(s => s.status_name === 'Lost')?.count || 0
    };

    const analyticsData = {
      statusDistribution: formattedStatusDistribution,
      labStatusData: processedLabData,
      summary,
      timelineData
    };

    res.json(analyticsData);
  } catch (error) {
    console.error("Error fetching inventory analytics:", error);
    res.status(500).json({ error: "Failed to fetch inventory analytics" });
  }
};
