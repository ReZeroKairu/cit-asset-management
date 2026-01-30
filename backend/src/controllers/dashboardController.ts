//backend/src/controllers/dashboardController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Get basic counts
    const [
      totalAssets,
      totalLaboratories,
      totalDailyReports,
      totalUsers,
      userLabReports
    ] = await Promise.all([
      // Total assets count
      prisma.inventory_assets.count(),
      
      // Total laboratories count
      prisma.laboratories.count(),
      
      // Total daily reports count
      prisma.daily_reports.count(),
      
      // Total users count
      prisma.users.count(),
      
      // If custodian, get their lab's reports only
      userRole === "Custodian" && userId
        ? prisma.users.findUnique({
            where: { user_id: userId },
            select: { lab_id: true }
          }).then(user => {
            if (user?.lab_id) {
              return prisma.daily_reports.count({
                where: { lab_id: user.lab_id }
              });
            }
            return 0;
          })
        : 0
    ]);

    // Get recent daily reports (last 5)
    const recentReports = await prisma.daily_reports.findMany({
      take: 5,
      orderBy: { report_date: "desc" },
      include: {
        users: {
          select: {
            full_name: true
          }
        },
        laboratories: {
          select: {
            lab_name: true
          }
        }
      }
    });

    // Get assets by laboratory
    const assetsByLab = await prisma.inventory_assets.groupBy({
      by: ['lab_id'],
      _count: {
        asset_id: true
      },
      where: {
        lab_id: {
          not: null
        }
      }
    });

    // Get lab names for the assets data
    const labIds = assetsByLab.map(item => item.lab_id).filter(Boolean);
    const labs = await prisma.laboratories.findMany({
      where: {
        lab_id: {
          in: labIds as number[]
        }
      },
      select: {
        lab_id: true,
        lab_name: true
      }
    });

    // Combine assets count with lab names
    const assetsByLabWithNames = assetsByLab.map(item => {
      const lab = labs.find(l => l.lab_id === item.lab_id);
      return {
        lab_id: item.lab_id,
        lab_name: lab?.lab_name || 'Unknown',
        asset_count: item._count.asset_id
      };
    });

    // Get user's assigned lab if they're a custodian
    let userAssignedLab = null;
    if (userRole === "Custodian" && userId) {
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        include: {
          assigned_lab: {
            select: {
              lab_id: true,
              lab_name: true,
              location: true
            }
          }
        }
      });
      userAssignedLab = user?.assigned_lab;
    }

    const dashboardData = {
      stats: {
        totalAssets,
        totalLaboratories,
        totalDailyReports: userRole === "Custodian" ? userLabReports : totalDailyReports,
        totalUsers
      },
      recentReports,
      assetsByLab: assetsByLabWithNames,
      userAssignedLab,
      userRole
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};
