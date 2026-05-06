import { Request, Response } from "express";
import { prisma } from "../config/database";
export const testDisposalTable = async (req: Request, res: Response) => {
  try {
    // Test if asset_disposals table exists
    const result = await prisma.$queryRaw`
      SHOW TABLES LIKE 'asset_disposals'
    `;

    res.json({
      message: "Disposal table test",
      result: result,
      success: true,
    });
  } catch (error: any) {
    console.error("Error testing disposal table:", error);
    res.status(500).json({
      error: error.message || "Failed to test disposal table",
      details: error.stack,
    });
  }
};
