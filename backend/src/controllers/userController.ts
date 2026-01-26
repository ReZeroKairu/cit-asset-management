import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
