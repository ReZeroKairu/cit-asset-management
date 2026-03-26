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
      totalForms,
      pendingComplaints,
      openComplaints,
      inProgressComplaints,
      servicedWorkstations,
      unservicedWorkstations
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
      userRole === "Admin" ? prisma.users.count() : 0,
      
      // Total forms count (pending only) - filtered by user role
      userRole === "Custodian" && userId
        ? prisma.users.findUnique({
            where: { user_id: userId },
            select: { lab_id: true }
          }).then(async user => {
            if (user?.lab_id) {
              // For custodians: count their own pending + custodian_approved forms + pending forms from their generated links
              const [labRequests, equipmentBorrows, softwareInstallations] = await Promise.all([
                // Lab requests: Pending and Custodian_Approved status
                prisma.lab_requests.count({
                  where: {
                    OR: [
                      { user_id: userId }, // Their own forms
                      { laboratory: user.lab_id.toString() } // Forms from their lab
                    ],
                    status: {
                      in: ['Pending', 'Custodian_Approved']
                    }
                  }
                }),
                // Equipment borrows: Pending and Custodian_Approved status
                prisma.equipment_borrows.count({
                  where: {
                    OR: [
                      { user_id: userId }, // Their own forms
                      { laboratory: user.lab_id.toString() } // Forms from their lab
                    ],
                    status: {
                      in: ['Pending', 'Custodian_Approved']
                    }
                  }
                }),
                // Software installations: Pending and Custodian_Approved status
                prisma.software_installations.count({
                  where: {
                    user_id: userId, // Only their own software installations
                    status: {
                      in: ['Pending', 'Custodian_Approved']
                    }
                  }
                })
              ]);
              return labRequests + equipmentBorrows + softwareInstallations;
            }
            return 0;
          })
        : prisma.$transaction(async (tx) => {
            // For admins: count all Custodian_Approved forms (ready for admin approval), excluding software installations
            const [labRequests, equipmentBorrows] = await Promise.all([
              // Lab requests: only Custodian_Approved status
              tx.lab_requests.count({
                where: {
                  status: 'Custodian_Approved'
                }
              }),
              // Equipment borrows: only Custodian_Approved status
              tx.equipment_borrows.count({
                where: {
                  status: 'Custodian_Approved'
                }
              })
              // Software installations excluded - handled by custodians only
            ]);
            return labRequests + equipmentBorrows;
          }),
      
      // Complaint stats - only count unfinished statuses (pending)
      userRole === "Custodian" && userId
        ? prisma.users.findUnique({
            where: { user_id: userId },
            select: { lab_id: true }
          }).then(user => {
            if (user?.lab_id) {
              return prisma.complaints.count({
                where: { 
                  lab_id: user.lab_id,
                  status: {
                    in: ['Open', 'In_Progress']
                  }
                }
              });
            }
            return 0;
          })
        : prisma.complaints.count({
            where: {
              status: {
                in: ['Open', 'In_Progress']
              }
            }
          }),
      
      // Open complaints count - filtered by user role
      userRole === "Custodian" && userId
        ? prisma.users.findUnique({
            where: { user_id: userId },
            select: { lab_id: true }
          }).then(user => {
            if (user?.lab_id) {
              return prisma.complaints.count({
                where: { 
                  lab_id: user.lab_id,
                  status: 'Open'
                }
              });
            }
            return 0;
          })
        : prisma.complaints.count({
            where: { status: 'Open' }
          }),
      
      // In Progress complaints count - filtered by user role
      userRole === "Custodian" && userId
        ? prisma.users.findUnique({
            where: { user_id: userId },
            select: { lab_id: true }
          }).then(user => {
            if (user?.lab_id) {
              return prisma.complaints.count({
                where: { 
                  lab_id: user.lab_id,
                  status: 'In_Progress'
                }
              });
            }
            return 0;
          })
        : prisma.complaints.count({
            where: { status: 'In_Progress' }
          }),

      // Serviced workstations count - UNIQUE workstations with recent maintenance reports (last 30 days)
      userRole === "Custodian" && userId
        ? prisma.users.findUnique({
            where: { user_id: userId },
            select: { lab_id: true }
          }).then(async user => {
            if (user?.lab_id) {
              // Count UNIQUE workstations that have had maintenance reports in the last 30 days
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              
              const servicedWorkstations = await prisma.pmc_reports.findMany({
                where: {
                  workstations: {
                    lab_id: user.lab_id
                  },
                  created_at: {
                    gte: thirtyDaysAgo
                  },
                  workstation_id: {
                    not: undefined
                  }
                },
                select: {
                  workstation_id: true
                },
                distinct: ['workstation_id']
              });
              
              // Count unique workstation IDs
              const uniqueWorkstationIds = new Set(
                servicedWorkstations.map(report => report.workstation_id).filter(id => id !== null)
              );
              
              return uniqueWorkstationIds.size;
            }
            return 0;
          })
        : (async () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            // Count UNIQUE workstations with recent maintenance reports (last 30 days)
            const servicedWorkstations = await prisma.pmc_reports.findMany({
              where: {
                created_at: {
                  gte: thirtyDaysAgo
                },
                workstation_id: {
                  not: undefined
                }
              },
              select: {
                workstation_id: true
              },
              distinct: ['workstation_id']
            });
            
            // Count unique workstation IDs
            const uniqueWorkstationIds = new Set(
              servicedWorkstations.map(report => report.workstation_id).filter(id => id !== null)
            );
            
            return uniqueWorkstationIds.size;
          })(),

      // Unserviced workstations count - workstations without recent maintenance reports
      userRole === "Custodian" && userId
        ? prisma.users.findUnique({
            where: { user_id: userId },
            select: { lab_id: true }
          }).then(async (user) => {
            if (user?.lab_id) {
              // Get total workstations in lab (same as inventory analytics)
              const totalWorkstations = await prisma.workstations.count({
                where: { lab_id: user.lab_id }
              });
              
              // Get workstations with recent maintenance (last 30 days) - more accurate counting
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              
              const servicedWorkstationIds = new Set(
                (await prisma.pmc_reports.findMany({
                  where: {
                    workstations: {
                      lab_id: user.lab_id
                    },
                    created_at: {
                      gte: thirtyDaysAgo
                    },
                    workstation_id: {
                      not: undefined  // Exclude undefined workstation_ids
                    }
                  },
                  select: {
                    workstation_id: true
                  },
                  distinct: ['workstation_id']
                })).map(report => report.workstation_id).filter(id => id !== null)
              );
              
              return Math.max(0, totalWorkstations - servicedWorkstationIds.size);
            }
            return 0;
          })
        : (async () => {
            // Get total workstations (same as inventory analytics)
            const totalWorkstations = await prisma.workstations.count();
            
            // Get workstations with recent maintenance (last 30 days) - more accurate counting
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const servicedWorkstationIds = new Set(
              (await prisma.pmc_reports.findMany({
                where: {
                  created_at: {
                    gte: thirtyDaysAgo
                  },
                  workstation_id: {
                    not: undefined  // Exclude undefined workstation_ids
                  }
                },
                select: {
                  workstation_id: true
                },
                distinct: ['workstation_id']
              })).map(report => report.workstation_id).filter(id => id !== null)
            );
            
            return Math.max(0, totalWorkstations - servicedWorkstationIds.size);
          })()
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
          laboratories: {
            select: {
              lab_id: true,
              lab_name: true,
              location: true
            }
          }
        }
      });
      userAssignedLab = user?.laboratories;
    }

    const dashboardData = {
      stats: {
        totalAssets,
        totalLaboratories,
        totalDailyReports,
        totalUsers,
        totalForms,
        totalComplaints: pendingComplaints,
        openComplaints,
        inProgressComplaints,
        servicedWorkstations,
        unservicedWorkstations
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
