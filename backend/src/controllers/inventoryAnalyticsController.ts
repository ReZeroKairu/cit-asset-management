import { Request, Response } from "express";
import * as InventoryAnalyticsService from "../services/inventoryAnalyticsService";

export const getInventoryAnalytics = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    const userLabId = req.user?.lab_id;

    const analyticsData =
      await InventoryAnalyticsService.getInventoryAnalyticsData(
        userRole,
        userId,
        userLabId,
      );

    res.json(analyticsData);
  } catch (error: any) {
    console.error("Error fetching inventory analytics:", error);

    if (error.message.includes("FORBIDDEN")) {
      return res
        .status(403)
        .json({ error: "Access denied. Admin or Custodian only." });
    }

    res.status(500).json({ error: "Failed to fetch inventory analytics" });
  }
};
