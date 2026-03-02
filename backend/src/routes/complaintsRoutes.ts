import express from "express";
import { PrismaClient } from "@prisma/client";
import { generateComplaintNumber } from "../utils/complaintUtils";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Get all laboratories with custodian info
router.get("/laboratories", async (req, res) => {
  try {
    const laboratories = await prisma.laboratories.findMany({
      include: {
        users: {
          where: {
            role: "Custodian"
          },
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    // Transform the data to include custodian info
    const labsWithCustodian = laboratories.map(lab => ({
      lab_id: lab.lab_id,
      lab_name: lab.lab_name,
      location: lab.location,
      custodian_user_id: lab.users[0]?.user_id || null,
      custodian: lab.users[0] || null
    }));

    res.json(labsWithCustodian);
  } catch (error) {
    console.error("Error fetching laboratories:", error);
    res.status(500).json({ message: "Failed to fetch laboratories" });
  }
});

// Get workstations by laboratory
router.get("/laboratories/:labId/workstations", async (req, res) => {
  try {
    const { labId } = req.params;
    const workstations = await prisma.workstations.findMany({
      where: {
        lab_id: parseInt(labId)
      },
      include: {
        laboratories: true,
        asset_statuses: true,
      },
      orderBy: {
        workstation_name: 'asc'
      }
    });

    res.json(workstations);
  } catch (error) {
    console.error("Error fetching workstations:", error);
    res.status(500).json({ message: "Failed to fetch workstations" });
  }
});

// Submit a new complaint
router.post("/", async (req, res) => {
  try {
    const {
      lab_id,
      workstation_id,
      faculty_student_name,
      user_type,
      year_level,
      issue_description,
      asset_info,
      asset_id
    } = req.body;

    console.log('Creating complaint with data:', {
      lab_id,
      workstation_id,
      faculty_student_name,
      user_type,
      year_level,
      issue_description,
      asset_info,
      asset_id
    });

    // Validation
    if (!lab_id || !faculty_student_name || !user_type || !issue_description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (user_type === "Student" && !year_level) {
      return res.status(400).json({ message: "Year level is required for students" });
    }

    // Validate asset_id if provided
    if (asset_id) {
      console.log('Validating asset_id:', asset_id);
      const assetExists = await prisma.inventory_assets.findUnique({
        where: { asset_id: parseInt(asset_id) }
      });
      if (!assetExists) {
        console.error('Asset not found:', asset_id);
        return res.status(400).json({ message: `Asset with ID ${asset_id} does not exist` });
      }
      console.log('Asset exists:', assetExists);
    }

    // Get laboratory and custodian info
    const laboratory = await prisma.laboratories.findUnique({
      where: { lab_id: parseInt(lab_id) },
      include: {
        users: {
          where: { role: "Custodian" },
          select: { user_id: true, full_name: true }
        }
      }
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
            location: true
          }
        },
        workstations: {
          select: {
            workstation_id: true,
            workstation_name: true
          }
        }
      }
    });

    res.status(201).json(complaint);
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({ message: "Failed to create complaint" });
  }
});

// Get complaint by ID (for tracking)
router.get("/:complaintId", async (req, res) => {
  try {
    const { complaintId } = req.params;
    
    const complaint = await prisma.complaints.findUnique({
      where: { complaint_id: parseInt(complaintId) },
      include: {
        laboratories: {
          select: {
            lab_id: true,
            lab_name: true,
            location: true
          }
        },
        workstations: {
          select: {
            workstation_id: true,
            workstation_name: true
          }
        },
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json(complaint);
  } catch (error) {
    console.error("Error fetching complaint:", error);
    res.status(500).json({ message: "Failed to fetch complaint" });
  }
});

// Check for existing complaints on an asset
router.get("/check-asset/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    
    // Check for existing complaints on this asset with unresolved status using asset_id
    const existingComplaint = await prisma.complaints.findFirst({
      where: {
        asset_id: parseInt(assetId),
        status: {
          in: ['Open', 'In_Progress']
        }
      },
      select: {
        complaint_id: true,
        status: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (existingComplaint) {
      res.json({
        hasExistingComplaint: true,
        existingComplaintId: existingComplaint.complaint_id,
        status: existingComplaint.status
      });
    } else {
      res.json({
        hasExistingComplaint: false
      });
    }
  } catch (error) {
    console.error("Error checking existing complaints:", error);
    res.status(500).json({ message: "Failed to check existing complaints" });
  }
});

// Get all complaints (for custodian management)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    let whereClause = {};
    
    // For custodians, only show complaints from their assigned lab
    if (userRole === "Custodian" && userId) {
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { lab_id: true }
      });
      
      if (user?.lab_id) {
        whereClause = { lab_id: user.lab_id };
      }
    }
    
    const complaints = await prisma.complaints.findMany({
      where: whereClause,
      include: {
        laboratories: {
          select: {
            lab_id: true,
            lab_name: true,
            location: true
          }
        },
        workstations: {
          select: {
            workstation_id: true,
            workstation_name: true
          }
        },
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

// Update complaint status
router.put("/:complaintId/status", authenticateToken, async (req, res) => {
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
        updated_at: new Date()
      },
      include: {
        laboratories: {
          select: {
            lab_id: true,
            lab_name: true,
            location: true
          }
        },
        workstations: {
          select: {
            workstation_id: true,
            workstation_name: true
          }
        }
      }
    });

    res.json(updatedComplaint);
  } catch (error) {
    console.error("Error updating complaint status:", error);
    res.status(500).json({ message: "Failed to update complaint status" });
  }
});

// Update complaint remarks
router.put("/:complaintId/remarks", authenticateToken, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { remarks } = req.body;

    const updatedComplaint = await prisma.complaints.update({
      where: { complaint_id: parseInt(complaintId as string) },
      data: {
        remarks: remarks || null,
        updated_at: new Date()
      },
      include: {
        laboratories: {
          select: {
            lab_id: true,
            lab_name: true,
            location: true
          }
        },
        workstations: {
          select: {
            workstation_id: true,
            workstation_name: true
          }
        }
      }
    });

    res.json(updatedComplaint);
  } catch (error) {
    console.error("Error updating complaint remarks:", error);
    res.status(500).json({ message: "Failed to update complaint remarks" });
  }
});

export default router;
