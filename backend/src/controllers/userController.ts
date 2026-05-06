import { Request, Response } from "express";
import * as UsersService from "../services/usersService";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId)
      return res.status(401).json({ error: "User authentication required" });
    const userProfile = await UsersService.getUserProfile(req.user.userId);
    res.json(userProfile);
  } catch (error: any) {
    console.error("ERROR in getUserProfile:", error);
    res
      .status(error.message.includes("NOT_FOUND") ? 404 : 500)
      .json({ error: error.message || "Failed to fetch user profile" });
  }
};

export const getUserAssignedLab = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId)
      return res.status(401).json({ error: "User authentication required" });
    const labData = await UsersService.getUserAssignedLab(req.user.userId);
    res.json(labData);
  } catch (error: any) {
    console.error("ERROR in getUserAssignedLab:", error);
    res
      .status(error.message.includes("NOT_FOUND") ? 404 : 500)
      .json({
        error: error.message || "Failed to fetch user assigned laboratory",
      });
  }
};

export const getAllUsersWithAssignments = async (
  req: Request,
  res: Response,
) => {
  try {
    const users = await UsersService.getAllUsersWithAssignments();
    res.json(users);
  } catch (error: any) {
    console.error("Error fetching users with assignments:", error);
    res.status(500).json({ error: "Failed to fetch users with assignments" });
  }
};

export const assignUserToLab = async (req: Request, res: Response) => {
  try {
    const { userId, labId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const updatedUser = await UsersService.assignUserToLab(
      parseInt(userId),
      labId ? parseInt(labId) : null,
    );
    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error assigning user to lab:", error);
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ error: error.message });
    if (error.message.includes("VALIDATION"))
      return res.status(400).json({ error: error.message });
    res.status(500).json({ error: "Failed to assign user to laboratory" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(userId))
      return res.status(400).json({ error: "User ID is required" });

    const updatedUser = await UsersService.updateUser(userId, req.body);
    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ error: error.message });
    if (error.message.includes("DUPLICATE"))
      return res.status(400).json({ error: error.message });
    res.status(500).json({ error: "Failed to update user" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (isNaN(userId))
      return res.status(400).json({ error: "User ID is required" });

    const result = await UsersService.deleteUser(userId, req.user!.userId);
    res.json(result);
  } catch (error: any) {
    console.error("Error deleting user:", error);
    if (error.message.includes("VALIDATION"))
      return res.status(400).json({ error: error.message });
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ error: error.message });
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const getOrganizationData = async (req: Request, res: Response) => {
  try {
    const orgData = await UsersService.getOrganizationData();
    res.json(orgData);
  } catch (error: any) {
    console.error("Error fetching organization data:", error);
    res.status(500).json({ error: "Failed to load organization data" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const newUser = await UsersService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error("Create User Error:", error);
    if (
      error.message.includes("DUPLICATE") ||
      error.message.includes("VALIDATION")
    ) {
      return res.status(400).json({ error: error.message });
    }
    // Handle Prisma specific codes (just in case they bleed through)
    if (error.code === "P2002")
      return res.status(400).json({ error: "Email already exists" });
    if (error.code === "P2025")
      return res.status(400).json({ error: "Laboratory not found" });

    res.status(500).json({ error: "Failed to create user" });
  }
};
