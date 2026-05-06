// src/controllers/adminAnalyticsController.ts
import { Request, Response } from "express";
import * as AdminAnalyticsService from "../services/adminAnalyticsService";

export const getAdminAnalytics = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;

    // Delegate to service
    const analyticsData =
      await AdminAnalyticsService.getAdminAnalyticsData(userRole);

    // Send response
    res.json(analyticsData);
  } catch (error: any) {
    console.error("Error fetching admin analytics:", error);

    // Handle specific business logic errors
    if (error.message.includes("FORBIDDEN")) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Handle generic server errors
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};
