import express from "express";
import { PrismaClient } from "@prisma/client";
import { generateComplaintNumber } from "../utils/complaintUtils";
import { authenticateToken } from "../middleware/auth";
import { validate, complaintSchema } from "../middleware/validation";
import { auditMiddleware } from "../middleware/audit";

const router = express.Router();
const prisma = new PrismaClient();

// Public complaint submission (no authentication required)
router.post(
  "/",
  validate(complaintSchema),
  auditMiddleware("CREATE", "public complaint"),
  async (req, res) => {
    try {
      const {
        lab_id,
        workstation_id,
        faculty_student_name,
        user_type,
        year_level,
        issue_description,
        asset_info,
      } = req.body;

      // Get laboratory and workstation info
      const laboratory = await prisma.laboratories.findUnique({
        where: { lab_id },
        include: {
          users: {
            where: { role: "Custodian" },
            take: 1,
          },
        },
      });

      if (!laboratory) {
        return res.status(400).json({ message: "Invalid laboratory" });
      }

      let workstation = null;
      if (workstation_id) {
        workstation = await prisma.workstations.findUnique({
          where: { workstation_id },
        });
        if (!workstation) {
          return res.status(400).json({ message: "Invalid workstation" });
        }
      }

      // Create complaint
      const complaint = await prisma.complaints.create({
        data: {
          lab_id,
          workstation_id: workstation_id || null,
          faculty_student_name,
          user_type,
          year_level: year_level || null,
          issue_description,
          asset_info: asset_info || null,
          status: "Open",
          monitored_by: laboratory.users[0]?.full_name || null,
          approved_by: laboratory.users[0]?.full_name || null,
          custodian_user_id: laboratory.users[0]?.user_id || null,
          updated_at: new Date(),
        },
        include: {
          laboratories: true,
          workstations: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Complaint submitted successfully",
        data: {
          complaint_id: complaint.complaint_id,
          status: complaint.status,
          created_at: complaint.created_at,
        },
      });
    } catch (error) {
      console.error("Error creating public complaint:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit complaint",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get all laboratories with custodian info (for public form) - NO AUTH REQUIRED
router.get("/public-laboratories", async (req, res) => {
  try {
    const laboratories = await prisma.laboratories.findMany({
      include: {
        users: {
          where: { role: "Custodian" },
          take: 1,
        },
      },
      orderBy: {
        lab_name: "asc",
      },
    });

    // Transform the data to include custodian info
    const labsWithCustodian = laboratories.map((lab) => ({
      lab_id: lab.lab_id,
      lab_name: lab.lab_name,
      location: lab.location,
      custodian_user_id: lab.users[0]?.user_id || null,
      custodian: lab.users[0] || null,
    }));

    res.json(labsWithCustodian);
  } catch (error) {
    console.error("Error fetching laboratories:", error);
    res.status(500).json({ message: "Failed to fetch laboratories" });
  }
});

// Get workstations by laboratory (for public form) - NO AUTH REQUIRED
router.get("/public-laboratories/:labId/workstations", async (req, res) => {
  try {
    const { labId } = req.params;

    const workstations = await prisma.workstations.findMany({
      where: {
        lab_id: parseInt(labId),
        workstation_name: {
          not: {
            contains: 'Server'
          }
        }
      }
    });

    // Apply natural sorting to ensure proper numerical order (WS-PC1, WS-PC2, WS-PC10)
    workstations.sort((a, b) => {
      const extractNumber = (name: string) => {
        const match = name.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const numA = extractNumber(a.workstation_name);
      const numB = extractNumber(b.workstation_name);
      
      if (numA !== numB) {
        return numA - numB;
      }
      
      // Fallback to alphabetical if numbers are the same
      return a.workstation_name.localeCompare(b.workstation_name);
    });

    res.json(workstations);
  } catch (error) {
    console.error("Error fetching workstations:", error);
    res.status(500).json({ message: "Failed to fetch workstations" });
  }
});

// Get assets by workstation (for public form) - NO AUTH REQUIRED
router.get("/public-workstations/:workstationId/assets", async (req, res) => {
  try {
    const { workstationId } = req.params;

    const assets = await prisma.inventory_assets.findMany({
      where: {
        workstation_id: parseInt(workstationId),
      },
      include: {
        units: {
          select: {
            unit_name: true,
          },
        },
        asset_details: {
          include: {
            asset_statuses: {
              select: {
                status_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        asset_id: "asc",
      },
    });

    res.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ message: "Failed to fetch assets" });
  }
});

// Get all laboratories with custodian info (authenticated - for admin/custodian)
router.get("/laboratories", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    let whereClause = {};

    // Role-based access control
    if (user?.role === "Custodian") {
      if (user.lab_id) {
        // Custodians can only see their assigned laboratory
        whereClause = { lab_id: user.lab_id };
      } else {
        // Unassigned custodians should see nothing
        whereClause = { lab_id: -1 }; // Impossible lab_id that will return no results
      }
    }

    const laboratories = await prisma.laboratories.findMany({
      where: whereClause,
      include: {
        users: {
          where: {
            role: "Custodian",
          },
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    // Transform the data to include custodian info
    const labsWithCustodian = laboratories.map((lab) => ({
      lab_id: lab.lab_id,
      lab_name: lab.lab_name,
      location: lab.location,
      custodian_user_id: lab.users[0]?.user_id || null,
      custodian: lab.users[0] || null,
    }));

    res.json(labsWithCustodian);
  } catch (error) {
    console.error("Error fetching laboratories:", error);
    res.status(500).json({ message: "Failed to fetch laboratories" });
  }
});

// Get workstations by laboratory
router.get(
  "/laboratories/:labId/workstations",
  authenticateToken,
  async (req, res) => {
    try {
      const { labId } = req.params;
      const user = req.user;

      // Role-based access control
      if (user?.role === "Custodian") {
        if (user.lab_id) {
          // Custodians can only see workstations from their assigned lab
          if (parseInt(labId as string) !== user.lab_id) {
            return res
              .status(403)
              .json({
                error:
                  "Access denied: You can only view workstations from your assigned laboratory",
              });
          }
        } else {
          // Unassigned custodians should see nothing
          return res
            .status(403)
            .json({
              error:
                "Access denied: You must be assigned to a laboratory to view workstations",
            });
        }
      }

      const workstations = await prisma.workstations.findMany({
        where: {
          lab_id: parseInt(labId as string),
          workstation_name: {
            not: {
              contains: 'Server'
            }
          }
        },
        include: {
          laboratories: true,
          asset_statuses: true,
        },
      });

      // Apply natural sorting to ensure proper numerical order (WS-PC1, WS-PC2, WS-PC10)
      workstations.sort((a, b) => {
        const extractNumber = (name: string) => {
          const match = name.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        
        const numA = extractNumber(a.workstation_name);
        const numB = extractNumber(b.workstation_name);
        
        if (numA !== numB) {
          return numA - numB;
        }
        
        // Fallback to alphabetical if numbers are the same
        return a.workstation_name.localeCompare(b.workstation_name);
      });

      res.json(workstations);
    } catch (error) {
      console.error("Error fetching workstations:", error);
      res.status(500).json({ message: "Failed to fetch workstations" });
    }
  }
);

// Submit a new complaint
router.post(
  "/",
  auditMiddleware("CREATE", "complaint"),
  validate(complaintSchema),
  async (req, res) => {
    try {
      const {
        lab_id,
        workstation_id,
        faculty_student_name,
        user_type,
        year_level,
        issue_description,
        asset_info,
        asset_id,
      } = req.body;

      // Validation
      if (
        !lab_id ||
        !faculty_student_name ||
        !user_type ||
        !issue_description
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (user_type === "Student" && !year_level) {
        return res
          .status(400)
          .json({ message: "Year level is required for students" });
      }

      // Validate asset_id if provided
      if (asset_id) {
        const assetExists = await prisma.inventory_assets.findUnique({
          where: { asset_id: parseInt(asset_id) },
        });
        if (!assetExists) {
          console.error("Asset not found:", asset_id);
          return res
            .status(400)
            .json({ message: `Asset with ID ${asset_id} does not exist` });
        }
      }

      // Get laboratory and custodian info
      const laboratory = await prisma.laboratories.findUnique({
        where: { lab_id: parseInt(lab_id) },
        include: {
          users: {
            where: { role: "Custodian" },
            select: { user_id: true, full_name: true },
          },
        },
      });

      if (!laboratory) {
        return res.status(400).json({ message: "Invalid laboratory" });
      }

      // Create complaint with auto-generated number
      const complaint = await prisma.complaints.create({
        data: {
          lab_id: parseInt(lab_id),
          workstation_id: workstation_id ? parseInt(workstation_id) : null,
          asset_id: asset_id ? parseInt(asset_id) : null,
          faculty_student_name,
          user_type,
          year_level: user_type === "Faculty" ? null : year_level,
          issue_description,
          asset_info: asset_info || null,
          monitored_by: laboratory.users[0]?.full_name || null,
          approved_by: laboratory.users[0]?.full_name || null,
          custodian_user_id: laboratory.users[0]?.user_id || null,
          updated_at: new Date(),
        },
        include: {
          laboratories: {
            select: {
              lab_id: true,
              lab_name: true,
              location: true,
            },
          },
          workstations: {
            select: {
              workstation_id: true,
              workstation_name: true,
            },
          },
        },
      });

      res.status(201).json(complaint);
    } catch (error) {
      console.error("Error creating complaint:", error);
      res.status(500).json({ message: "Failed to create complaint" });
    }
  }
);

// Get complaints analytics for dashboard
router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { startDate, endDate } = req.query;

    let whereClause: any = {};

    // For custodians, only get analytics from their assigned lab
    if (userRole === "Custodian") {
      if (userId) {
        const user = await prisma.users.findUnique({
          where: { user_id: userId },
          select: { lab_id: true },
        });

        if (user?.lab_id) {
          whereClause = { lab_id: user.lab_id };
        } else {
          // Unassigned custodians should see nothing
          whereClause = { lab_id: -1 }; // Impossible lab_id that will return no results
        }
      } else {
        // No userId - should not happen with authentication middleware
        whereClause = { lab_id: -1 };
      }
    }

    // Add date filtering if provided
    if (startDate || endDate) {
      if (!whereClause.created_at) {
        whereClause.created_at = {};
      }
      if (startDate) {
        whereClause.created_at.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.created_at.lte = new Date(endDate as string);
      }
    }

    // Get total complaints count
    const totalComplaints = await prisma.complaints.count({
      where: whereClause,
    });

    // Get total resolved complaints count
    const totalResolvedComplaints = await prisma.complaints.count({
      where: {
        ...whereClause,
        status: "Resolved",
      },
    });

    // Get complaints grouped by laboratory (total)
    const labComplaints = await prisma.complaints.groupBy({
      by: ["lab_id"],
      where: whereClause,
      _count: {
        complaint_id: true,
      },
    });

    // Get resolved complaints grouped by laboratory
    const labResolvedComplaints = await prisma.complaints.groupBy({
      by: ["lab_id"],
      where: {
        ...whereClause,
        status: "Resolved",
      },
      _count: {
        complaint_id: true,
      },
    });

    // Get lab names for the groups
    const labIds = [
      ...new Set([
        ...labComplaints.map((lc) => lc.lab_id),
        ...labResolvedComplaints.map((lc) => lc.lab_id),
      ]),
    ];
    const labs = await prisma.laboratories.findMany({
      where: {
        lab_id: {
          in: labIds,
        },
      },
      select: {
        lab_id: true,
        lab_name: true,
      },
    });

    // Create lab name lookup
    const labNameMap = labs.reduce((acc, lab) => {
      acc[lab.lab_id] = lab.lab_name;
      return acc;
    }, {} as Record<number, string>);

    // Create resolved complaints lookup
    const resolvedLookup = labResolvedComplaints.reduce((acc, lc) => {
      acc[lc.lab_id] = lc._count.complaint_id;
      return acc;
    }, {} as Record<number, number>);

    // Transform the data to include both total and resolved counts
    const labComplaintsData = labIds.map((labId) => ({
      lab_name: labNameMap[labId] || "Unknown Lab",
      total_count:
        labComplaints.find((lc) => lc.lab_id === labId)?._count.complaint_id ||
        0,
      resolved_count: resolvedLookup[labId] || 0,
    }));

    res.json({
      totalComplaints,
      totalResolvedComplaints,
      labComplaints: labComplaintsData,
    });
  } catch (error) {
    console.error("Error fetching complaints analytics:", error);
    res.status(500).json({ message: "Failed to fetch complaints analytics" });
  }
});

// Get complaint by ID (for tracking)
router.get("/:complaintId", authenticateToken, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const user = req.user;

    const complaint = await prisma.complaints.findUnique({
      where: { complaint_id: parseInt(complaintId as string) },
      include: {
        laboratories: {
          select: {
            lab_id: true,
            lab_name: true,
            location: true,
          },
        },
        workstations: {
          select: {
            workstation_id: true,
            workstation_name: true,
          },
        },
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Role-based access control
    if (user?.role === "Custodian") {
      if (user.lab_id) {
        // Custodians can only see complaints from their assigned lab
        if (complaint.lab_id !== user.lab_id) {
          return res
            .status(403)
            .json({
              error:
                "Access denied: You can only view complaints from your assigned laboratory",
            });
        }
      } else {
        // Unassigned custodians should see nothing
        return res
          .status(403)
          .json({
            error:
              "Access denied: You must be assigned to a laboratory to view complaints",
          });
      }
    }

    res.json(complaint);
  } catch (error) {
    console.error("Error fetching complaint:", error);
    res.status(500).json({ message: "Failed to fetch complaint" });
  }
});

// Check for existing complaints on an asset (PUBLIC - no authentication required)
router.get("/public-check-asset/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;

    // First get the asset to check if it exists
    const asset = await prisma.inventory_assets.findUnique({
      where: { asset_id: parseInt(assetId as string) },
      select: { lab_id: true },
    });

    if (!asset) {
      return res.status(404).json({ hasExistingComplaint: false });
    }

    // Check for existing complaints on this asset with unresolved status using asset_id
    const existingComplaint = await prisma.complaints.findFirst({
      where: {
        asset_id: parseInt(assetId as string),
        status: {
          in: ["Open", "In_Progress"],
        },
      },
      select: {
        complaint_id: true,
        status: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (existingComplaint) {
      res.json({
        hasExistingComplaint: true,
        existingComplaintId: existingComplaint.complaint_id,
        status: existingComplaint.status,
      });
    } else {
      res.json({
        hasExistingComplaint: false,
      });
    }
  } catch (error) {
    console.error("Error checking existing complaints:", error);
    res.status(500).json({ message: "Failed to check existing complaints" });
  }
});

// Check for existing complaints on an asset
router.get("/check-asset/:assetId", authenticateToken, async (req, res) => {
  try {
    const { assetId } = req.params;
    const user = req.user;

    // First get the asset to check its lab
    const asset = await prisma.inventory_assets.findUnique({
      where: { asset_id: parseInt(assetId as string) },
      select: { lab_id: true },
    });

    if (!asset) {
      return res.status(404).json({ hasExistingComplaint: false });
    }

    // Role-based access control
    if (user?.role === "Custodian") {
      if (user.lab_id) {
        // Custodians can only check assets from their assigned lab
        if (asset.lab_id !== user.lab_id) {
          return res
            .status(403)
            .json({
              error:
                "Access denied: You can only check assets from your assigned laboratory",
            });
        }
      } else {
        // Unassigned custodians should see nothing
        return res
          .status(403)
          .json({
            error:
              "Access denied: You must be assigned to a laboratory to check assets",
          });
      }
    }

    // Check for existing complaints on this asset with unresolved status using asset_id
    const existingComplaint = await prisma.complaints.findFirst({
      where: {
        asset_id: parseInt(assetId as string),
        status: {
          in: ["Open", "In_Progress"],
        },
      },
      select: {
        complaint_id: true,
        status: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (existingComplaint) {
      res.json({
        hasExistingComplaint: true,
        existingComplaintId: existingComplaint.complaint_id,
        status: existingComplaint.status,
      });
    } else {
      res.json({
        hasExistingComplaint: false,
      });
    }
  } catch (error) {
    console.error("Error checking existing complaints:", error);
    res.status(500).json({ message: "Failed to check existing complaints" });
  }
});

// Get all complaints (for custodian management) - with view optimization + fallback
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Build SQL where conditions for view
    let whereConditions: string[] = [];
    const params: any[] = [];

    // For custodians, only show complaints from their assigned lab
    if (userRole === "Custodian") {
      if (userId) {
        const user = await prisma.users.findUnique({
          where: { user_id: userId },
          select: { lab_id: true },
        });

        if (user?.lab_id) {
          whereConditions.push("lab_id = ?");
          params.push(user.lab_id);
        } else {
          // Unassigned custodians see nothing
          return res.json([]);
        }
      } else {
        // No userId - should not happen with authentication middleware
        return res.json([]);
      }
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    let complaints: any[] = [];
    let usedView = false;

    try {
      // Try optimized view first
      complaints = await prisma.$queryRawUnsafe(`
        SELECT 
          complaint_id,
          lab_id,
          workstation_id,
          asset_id,
          faculty_student_name,
          user_type,
          year_level,
          issue_description,
          asset_info,
          complaint_status as status,
          monitored_by,
          approved_by,
          custodian_user_id,
          remarks,
          resolved_at,
          created_at,
          updated_at,
          accepted_at,
          lab_name,
          workstation_name,
          asset_property_tag,
          custodian_name
        FROM view_complaint_details
        ${whereClause}
        ORDER BY created_at DESC
      `, ...params);
      
      usedView = true;
    } catch (viewError) {
      console.log('⚠️ View failed, falling back to Prisma:', (viewError as Error).message);
      
      // Build Prisma where clause as fallback
      const prismaWhere: any = {};
      if (userRole === "Custodian" && userId) {
        const user = await prisma.users.findUnique({
          where: { user_id: userId },
          select: { lab_id: true },
        });
        
        if (user?.lab_id) {
          prismaWhere.lab_id = user.lab_id;
        } else {
          prismaWhere.lab_id = -1;
        }
      }
      
      const prismaComplaints = await prisma.complaints.findMany({
        where: prismaWhere,
        include: {
          laboratories: {
            select: {
              lab_id: true,
              lab_name: true,
              location: true,
            },
          },
          workstations: {
            select: {
              workstation_id: true,
              workstation_name: true,
            },
          },
          users: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });
      
      return res.json(prismaComplaints);
    }

    if (usedView) {
      // Transform view result to match Prisma structure
      const transformedComplaints = (complaints as any[]).map(c => ({
        complaint_id: Number(c.complaint_id),
        lab_id: Number(c.lab_id),
        workstation_id: Number(c.workstation_id),
        asset_id: Number(c.asset_id),
        faculty_student_name: c.faculty_student_name,
        user_type: c.user_type,
        year_level: c.year_level,
        issue_description: c.issue_description,
        asset_info: c.asset_info,
        status: c.status,
        monitored_by: c.monitored_by,
        approved_by: c.approved_by,
        custodian_user_id: Number(c.custodian_user_id),
        remarks: c.remarks,
        resolved_at: c.resolved_at,
        created_at: c.created_at,
        updated_at: c.updated_at,
        accepted_at: c.accepted_at,
        laboratories: c.lab_name ? {
          lab_id: Number(c.lab_id),
          lab_name: c.lab_name,
          location: null
        } : null,
        workstations: c.workstation_name ? {
          workstation_id: Number(c.workstation_id),
          workstation_name: c.workstation_name
        } : null,
        users: c.custodian_name ? {
          user_id: Number(c.custodian_user_id),
          full_name: c.custodian_name,
          email: null
        } : null
      }));
      
      res.json(transformedComplaints);
    }
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

// Update complaint status
router.put(
  "/:complaintId/status",
  authenticateToken,
  auditMiddleware("UPDATE", "complaint status"),
  async (req, res) => {
    try {
      const { complaintId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updatedComplaint = await prisma.complaints.update({
        where: { complaint_id: parseInt(complaintId as string) },
        data: {
          status: status,
          updated_at: new Date(),
        },
        include: {
          laboratories: {
            select: {
              lab_id: true,
              lab_name: true,
              location: true,
            },
          },
          workstations: {
            select: {
              workstation_id: true,
              workstation_name: true,
            },
          },
        },
      });

      res.json(updatedComplaint);
    } catch (error) {
      console.error("Error updating complaint status:", error);
      res.status(500).json({ message: "Failed to update complaint status" });
    }
  }
);

// Update complaint remarks
router.put(
  "/:complaintId/remarks",
  authenticateToken,
  auditMiddleware("UPDATE", "complaint remarks"),
  async (req, res) => {
    try {
      const { complaintId } = req.params;
      const { remarks } = req.body;

      const updatedComplaint = await prisma.complaints.update({
        where: { complaint_id: parseInt(complaintId as string) },
        data: {
          remarks: remarks || null,
          updated_at: new Date(),
        },
        include: {
          laboratories: {
            select: {
              lab_id: true,
              lab_name: true,
              location: true,
            },
          },
          workstations: {
            select: {
              workstation_id: true,
              workstation_name: true,
            },
          },
        },
      });

      res.json(updatedComplaint);
    } catch (error) {
      console.error("Error updating complaint remarks:", error);
      res.status(500).json({ message: "Failed to update complaint remarks" });
    }
  }
);

export default router;
