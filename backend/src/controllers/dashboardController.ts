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
      totalUsers
    ] = await Promise.all([
      // Total assets count - filtered by user role
      userRole === "Custodian" && userId
        ? prisma.users.findUnique({
            where: { user_id: userId },
            select: { lab_id: true }
          }).then(user => {
            if (user?.lab_id) {
              return prisma.inventory_assets.count({
                where: { lab_id: user.lab_id }
              });
            }
            return 0;
          })
        : prisma.inventory_assets.count(),
      
      // Total laboratories count - only for admins
      userRole === "Admin" ? prisma.laboratories.count() : 0,
      
      // Total pending daily reports count - filtered by user role
      userRole === "Custodian" && userId
        ? prisma.users.findUnique({
            where: { user_id: userId },
            select: { lab_id: true }
          }).then(user => {
            if (user?.lab_id) {
              return prisma.daily_reports.count({
                where: { 
                  lab_id: user.lab_id,
                  status: 'Pending'
                }
              });
            }
            return 0;
          })
        : prisma.daily_reports.count({
            where: { status: 'Pending' }
          }),
      
      // Total users count - only for admins
      userRole === "Admin" ? prisma.users.count() : 0
    ]);

    // Get recent pending daily reports (last 5) - filtered by user role
    let recentReports: any[] | null = null;
    if (userRole === "Custodian" && userId) {
      // For custodians, only get reports from their assigned lab
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { lab_id: true }
      });
      
      if (user?.lab_id) {
        recentReports = await prisma.daily_reports.findMany({
          take: 5,
          where: { 
            status: 'Pending',
            lab_id: user.lab_id
          },
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
      } else {
        recentReports = [];
      }
    } else {
      // For admins, get all pending reports
      recentReports = await prisma.daily_reports.findMany({
        take: 5,
        where: { status: 'Pending' },
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
    }

    // Get assets by laboratory - filtered by user role
    let assetsByLab: { lab_id: number | null; _count: { asset_id: number } }[] | null = null;
    if (userRole === "Custodian" && userId) {
      // For custodians, only get assets from their assigned lab
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { lab_id: true }
      });
      
      if (user?.lab_id) {
        assetsByLab = await prisma.inventory_assets.groupBy({
          by: ['lab_id'],
          _count: {
            asset_id: true
          },
          where: {
            lab_id: user.lab_id
          }
        });
      } else {
        assetsByLab = [];
      }
    } else {
      // For admins, get all assets by lab
      assetsByLab = await prisma.inventory_assets.groupBy({
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
    }

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
        totalDailyReports,
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
