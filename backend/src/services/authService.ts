import { prisma } from "../config/database";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { config } from "../config/config"; // Adjust path as needed

export const verifyPassword = async (userId: number, password: string) => {
  const user = await prisma.users.findUnique({ where: { user_id: userId } });
  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(password, user.password_hash);
  return { valid: isValid };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.users.findUnique({
    where: { email },
    include: {
      laboratories: { select: { lab_name: true } },
    },
  });

  if (!user) throw new Error("Invalid credentials");

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { userId: user.user_id, role: user.role },
    config.jwtSecret || process.env.JWT_SECRET || "super_secret_key_change_me",
    { expiresIn: "8h" },
  );

  return {
    token,
    user: {
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      lab_id: user.lab_id,
      lab_name: user.laboratories?.lab_name || null,
    },
  };
};
