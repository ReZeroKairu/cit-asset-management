//backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { config } from "../config/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extend Request interface to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
        lab_id?: number;
      };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, config.jwtSecret, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    try {
      // Fetch user details including lab_id from database
      const user = await prisma.users.findUnique({
        where: { user_id: decoded.userId },
        select: {
          user_id: true,
          role: true,
          lab_id: true,
        },
      });

      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      req.user = {
        userId: user.user_id,
        role: user.role as string,
        lab_id: user.lab_id || undefined,
      };

      next();
    } catch (error) {
      console.error("Error fetching user details:", error);
      return res.status(500).json({ error: "Authentication failed" });
    }
  });
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};
