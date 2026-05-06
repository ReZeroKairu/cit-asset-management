import { Request, Response } from "express";
import * as AuthService from "../services/authService";

export const verifyPassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const result = await AuthService.verifyPassword(userId, password);
    res.json(result);
  } catch (error: any) {
    console.error("Password verification error:", error);
    res
      .status(error.message === "User not found" ? 401 : 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(401).json({ error: error.message || "Invalid credentials" });
  }
};
