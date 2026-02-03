//backend/src/controllers/labController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get all laboratories
export const getLaboratories = async (req: Request, res: Response) => {
  try {
    const laboratories = await prisma.laboratories.findMany({
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            role: true,
          },
          where: {
            role: "Custodian",
          },
        },
        departments: {
          select: {
            dept_id: true,
            dept_name: true,
          },
        },
      },
      orderBy: {
        lab_name: "asc",
      },
    });

    res.json(laboratories);
  } catch (error) {
    console.error("Error fetching laboratories:", error);
    res.status(500).json({ error: "Failed to fetch laboratories" });
  }
};

// POST: Create new laboratory
export const createLaboratory = async (req: Request, res: Response) => {
  try {
    const { lab_name, location, dept_id } = req.body;

    if (!lab_name) {
      return res.status(400).json({ error: "Laboratory name is required" });
    }

    // Check if laboratory name already exists
    const existingLab = await prisma.laboratories.findFirst({
      where: { lab_name },
    });

    if (existingLab) {
      return res
        .status(400)
        .json({ error: "Laboratory with this name already exists" });
    }

    const newLab = await prisma.laboratories.create({
      data: {
        lab_name,
        location: location || null,
        dept_id: dept_id ? parseInt(dept_id) : null,
      },
    });

    res.status(201).json(newLab);
  } catch (error) {
    console.error("Error creating laboratory:", error);
    res.status(500).json({ error: "Failed to create laboratory" });
  }
};

// PUT: Update laboratory
export const updateLaboratory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const labId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
    const { lab_name, location, dept_id } = req.body;

    if (!labId) {
      return res.status(400).json({ error: "Laboratory ID is required" });
    }

    // Check if laboratory exists
    const existingLab = await prisma.laboratories.findUnique({
      where: { lab_id: labId },
    });

    if (!existingLab) {
      return res.status(404).json({ error: "Laboratory not found" });
    }

    // If updating name, check for duplicates
    if (lab_name && lab_name !== existingLab.lab_name) {
      const duplicateLab = await prisma.laboratories.findFirst({
        where: { lab_name },
      });

      if (duplicateLab) {
        return res
          .status(400)
          .json({ error: "Laboratory with this name already exists" });
      }
    }

    const updatedLab = await prisma.laboratories.update({
      where: { lab_id: labId },
      data: {
        lab_name: lab_name || existingLab.lab_name,
        location: location !== undefined ? location : existingLab.location,
        dept_id:
          dept_id !== undefined
            ? dept_id
              ? parseInt(dept_id)
              : null
            : existingLab.dept_id,
      },
    });

    res.json(updatedLab);
  } catch (error) {
    console.error("Error updating laboratory:", error);
    res.status(500).json({ error: "Failed to update laboratory" });
  }
};

// DELETE: Delete laboratory
export const deleteLaboratory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const labId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);

    if (!labId) {
      return res.status(400).json({ error: "Laboratory ID is required" });
    }

    // Check if laboratory exists
    const existingLab = await prisma.laboratories.findUnique({
      where: { lab_id: labId },
    });

    if (!existingLab) {
      return res.status(404).json({ error: "Laboratory not found" });
    }

    // Check if laboratory has assigned users
    const assignedUsers = await prisma.users.count({
      where: { lab_id: labId },
    });

    if (assignedUsers > 0) {
      return res.status(400).json({
        error:
          "Cannot delete laboratory with assigned users. Please reassign users first.",
      });
    }

    // Check if laboratory has inventory assets
    const assetCount = await prisma.inventory_assets.count({
      where: { lab_id: labId },
    });

    if (assetCount > 0) {
      return res.status(400).json({
        error:
          "Cannot delete laboratory with inventory assets. Please move or delete assets first.",
      });
    }

    // Check if laboratory has daily reports
    const reportCount = await prisma.daily_reports.count({
      where: { lab_id: labId },
    });

    if (reportCount > 0) {
      return res.status(400).json({
        error:
          "Cannot delete laboratory with daily reports. Please delete reports first.",
      });
    }

    await prisma.laboratories.delete({
      where: { lab_id: labId },
    });

    res.json({ message: "Laboratory deleted successfully" });
  } catch (error) {
    console.error("Error deleting laboratory:", error);
    res.status(500).json({ error: "Failed to delete laboratory" });
  }
};

// GET: Get single laboratory by ID
export const getLaboratoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const labId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(labId)) {
      return res.status(400).json({ error: "Invalid laboratory ID" });
    }

    const laboratory = await prisma.laboratories.findUnique({
      where: { lab_id: labId },
      include: {
        users: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
        departments: {
          select: {
            dept_id: true,
            dept_name: true,
          },
        },
      },
    });

    if (!laboratory) {
      return res.status(404).json({ error: "Laboratory not found" });
    }

    // Get the in-charge user separately
    let inCharge = null;
    if (laboratory.in_charge_id) {
      inCharge = await prisma.users.findUnique({
        where: { user_id: laboratory.in_charge_id },
        select: {
          user_id: true,
          full_name: true,
          email: true,
          role: true,
        },
      });
    }

    // Add in_charge to the response
    const response = {
      ...laboratory,
      in_charge: inCharge,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching laboratory:", error);
    res.status(500).json({ error: "Failed to fetch laboratory" });
  }
};
