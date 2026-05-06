import { Request, Response } from "express";
import * as DashboardService from "../services/dashboardService";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // The Controller just hands the request off to the Service
    const dashboardData = await DashboardService.getDashboardOverview(
      userId,
      userRole,
    );

    // And returns the result
    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};
