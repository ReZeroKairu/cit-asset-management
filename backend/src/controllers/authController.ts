//backend/src/controllers/authController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { config } from "../config";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_me";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Find user
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // 2. Compare Password (Input vs Hash in DB)
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    // 3. Generate Token (Contains user ID and Role)
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      config.jwtSecret,
      { expiresIn: "8h" },
    );

    // 4. Return Token + User Info (Exclude password)
    res.json({
      token,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        lab_id: user.lab_id, // Include lab assignment for custodians
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
