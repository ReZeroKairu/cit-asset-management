//backend/src/controllers/userController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// GET: Get current user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        role: true,
        lab_id: true,
        created_at: true,
        assigned_lab: {
          select: {
            lab_id: true,
            lab_name: true,
            location: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Transform the data to match frontend expectations
    const userProfile = {
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      lab_id: user.lab_id,
        laboratory: user.assigned_lab,
      created_at: user.created_at
    };

    res.json(userProfile);
  } catch (error) {
    console.error("ERROR in getUserProfile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// GET: Get current user's assigned laboratory
export const getUserAssignedLab = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let assignedLab = null;
    if (user.lab_id) {
      assignedLab = await prisma.laboratories.findUnique({
        where: { lab_id: user.lab_id },
        select: {
          lab_id: true,
          lab_name: true,
          location: true,
        },
      });
    }

    const response = {
      assigned_lab: assignedLab,
      has_lab: !!assignedLab,
      // Also include the lab_id for compatibility
      lab_id: user.lab_id,
      laboratory: assignedLab
    };

    res.json(response);
  } catch (error) {
    console.error("ERROR in getUserAssignedLab:", error);
    res.status(500).json({ error: "Failed to fetch user assigned laboratory" });
  }
};

// GET: Get all users with their laboratory assignments
export const getAllUsersWithAssignments = async (
  req: Request,
  res: Response,
) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: {
        full_name: "asc",
      },
    });

    // Get all laboratories for reference
    const laboratories = await prisma.laboratories.findMany({
      select: {
        lab_id: true,
        lab_name: true,
        location: true,
      },
    });

    // Transform the data to match frontend expectations
    const transformedUsers = users.map(user => {
      const assignedLab = laboratories.find(lab => lab.lab_id === user.lab_id);
      return {
        ...user,
        assigned_lab: assignedLab || null,
        has_lab: !!assignedLab,
      };
    });

    res.json(transformedUsers);
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
      where: { user_id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If labId is null, remove assignment
    if (labId === null || labId === "") {
      const updatedUser = await prisma.users.update({
        where: { user_id: parseInt(userId) },
        data: { lab_id: null },
        include: {
          assigned_lab: {
            select: {
              lab_id: true,
              lab_name: true,
              location: true,
            },
          },
        },
      });
      
      // Transform the response to match frontend expectations
      const transformedUser = {
        ...updatedUser,
        assigned_lab: updatedUser.assigned_lab,
        has_lab: !!updatedUser.assigned_lab,
      };
      
      return res.json(transformedUser);
    }

    // Verify lab exists
    const lab = await prisma.laboratories.findUnique({
      where: { lab_id: parseInt(labId) },
    });

    if (!lab) {
      return res.status(404).json({ error: "Laboratory not found" });
    }

    // Check if lab already has a custodian assigned
    const existingCustodian = await prisma.users.findFirst({
      where: {
        lab_id: parseInt(labId),
        role: "Custodian"
      }
    });

    if (existingCustodian && existingCustodian.user_id !== parseInt(userId)) {
      return res.status(400).json({ 
        error: "This laboratory already has a custodian assigned. Only one custodian per laboratory is allowed." 
      });
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
            location: true,
          },
        },
      },
    });

    // Transform the response to match frontend expectations
    const transformedUser = {
      ...updatedUser,
      assigned_lab: updatedUser.assigned_lab,
      has_lab: !!updatedUser.assigned_lab,
    };

    res.json(transformedUser);
  } catch (error) {
    console.error("Error assigning user to lab:", error);
    res.status(500).json({ error: "Failed to assign user to laboratory" });
  }
};

// PUT: Update user information
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
    const { full_name, email, role } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // If updating email, check for duplicates
    if (email && email !== existingUser.email) {
      const duplicateUser = await prisma.users.findFirst({
        where: { email },
      });

      if (duplicateUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
    }

    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: {
        full_name: full_name || existingUser.full_name,
        email: email || existingUser.email,
        role: role || existingUser.role,
      },
      include: {
        assigned_lab: {
          select: {
            lab_id: true,
            lab_name: true,
            location: true,
          },
        },
      },
    });

    // Transform the response to match frontend expectations
    const transformedUser = {
      ...updatedUser,
      assigned_lab: updatedUser.assigned_lab,
      has_lab: !!updatedUser.assigned_lab,
    };

    res.json(transformedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// DELETE: Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deletion of the current user
    if (req.user?.userId === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await prisma.users.delete({
      where: { user_id: userId },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
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

    // 3. Check if lab already has a custodian assigned (only for custodian role)
    if (lab_id && (role === "Custodian" || !role)) {
      const existingCustodian = await prisma.users.findFirst({
        where: {
          lab_id: Number(lab_id),
          role: "Custodian"
        }
      });

      if (existingCustodian) {
        return res.status(400).json({ 
          error: "This laboratory already has a custodian assigned. Only one custodian per laboratory is allowed." 
        });
      }
    }

    // 4. Create User and update laboratory in_charge_id in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.users.create({
        data: {
          full_name,
          email,
          password_hash: hashedPassword,
          role: role || "Custodian",
          lab_id: lab_id ? Number(lab_id) : null,
        },
        include: {
          assigned_lab: {
            select: {
              lab_id: true,
              lab_name: true,
              location: true,
            },
          },
        },
      });

      // If creating a custodian with a lab assignment, update the laboratory's in_charge_id
      if (lab_id && (role === "Custodian" || !role)) {
        await tx.laboratories.update({
          where: { lab_id: Number(lab_id) },
          data: { in_charge_id: newUser.user_id },
        });
      }

      return newUser;
    });

    // Exclude password from response and transform for frontend
    const { password_hash, ...userWithoutPassword } = result;
    
    // Transform the response to match frontend expectations
    const transformedUser = {
      ...userWithoutPassword,
      assigned_lab: result.assigned_lab || null,
      has_lab: !!result.assigned_lab,
    };

    res.status(201).json({
      ...transformedUser,
      message:
        role === "Custodian" || !role
          ? "Custodian created and assigned as laboratory manager successfully"
          : "User created successfully",
    });
  } catch (error: any) {
    console.error("Create User Error:", error);

    // Handle specific database errors
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" });
    }

    if (error.code === "P2025") {
      return res.status(400).json({ error: "Laboratory not found" });
    }

    res.status(500).json({ error: "Failed to create user" });
  }
};
