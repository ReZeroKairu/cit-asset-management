import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// GET: Get current user's assigned laboratory
export const getUserAssignedLab = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    console.log("getUserAssignedLab called - userId:", userId);
    
    if (!userId) {
      console.log("ERROR: No userId in request");
      return res.status(401).json({ error: "User authentication required" });
    }

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

    console.log("Database result:", { 
      user_id: user?.user_id, 
      lab_id: user?.lab_id, 
      assigned_lab: user?.assigned_lab 
    });

    if (!user) {
      console.log("ERROR: User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const response = { 
      assigned_lab: user.assigned_lab,
      has_lab: !!user.assigned_lab
    };
    
    console.log("Sending response:", response);
    res.json(response);
  } catch (error) {
    console.error("ERROR in getUserAssignedLab:", error);
    res.status(500).json({ error: "Failed to fetch user assigned laboratory" });
  }
};

// GET: Get all users with their laboratory assignments
export const getAllUsersWithAssignments = async (req: Request, res: Response) => {
  try {
    const users = await prisma.users.findMany({
      include: {
        assigned_lab: {
          select: {
            lab_id: true,
            lab_name: true,
            location: true
          }
        }
      },
      orderBy: {
        full_name: 'asc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users with assignments:", error);
    res.status(500).json({ error: "Failed to fetch users with assignments" });
  }
};

// PUT: Assign user to laboratory
export const assignUserToLab = async (req: Request, res: Response) => {
  try {
    const { userId, labId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Verify user exists
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If labId is null, remove assignment
    if (labId === null || labId === '') {
      const updatedUser = await prisma.users.update({
        where: { user_id: parseInt(userId) },
        data: { lab_id: null },
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
      return res.json(updatedUser);
    }

    // Verify lab exists
    const lab = await prisma.laboratories.findUnique({
      where: { lab_id: parseInt(labId) }
    });

    if (!lab) {
      return res.status(404).json({ error: "Laboratory not found" });
    }

    // Update user assignment
    const updatedUser = await prisma.users.update({
      where: { user_id: parseInt(userId) },
      data: { lab_id: parseInt(labId) },
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

    res.json(updatedUser);
  } catch (error) {
    console.error("Error assigning user to lab:", error);
    res.status(500).json({ error: "Failed to assign user to laboratory" });
  }
};

// GET: Fetch all data needed for the dropdowns (Campuses, Depts, Labs)
export const getOrganizationData = async (req: Request, res: Response) => {
  try {
    const [campuses, officeTypes, departments, laboratories] =
      await Promise.all([
        prisma.campuses.findMany(),
        prisma.office_types.findMany(),
        prisma.departments.findMany(),
        prisma.laboratories.findMany(),
      ]);

    res.json({ campuses, officeTypes, departments, laboratories });
  } catch (error) {
    res.status(500).json({ error: "Failed to load organization data" });
  }
};

// POST: Create a new Custodian User
export const createUser = async (req: Request, res: Response) => {
  try {
    const { full_name, email, password, role, lab_id } = req.body;

    // 1. Check if email exists
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Email already exists" });

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User
    const newUser = await prisma.users.create({
      data: {
        full_name,
        email,
        password_hash: hashedPassword,
        role: role || "Custodian",
        lab_id: lab_id ? Number(lab_id) : null,
      },
    });

    // Exclude password from response
    const { password_hash, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};
