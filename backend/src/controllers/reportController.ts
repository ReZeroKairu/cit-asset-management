import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Generate report data
export const getReportData = async (req: Request, res: Response) => {
  try {
    const { lab_id, start_date, end_date } = req.query;
    
    const where: any = {};
    
    if (lab_id) where.lab_id = parseInt(lab_id as string);
    if (start_date && end_date) {
      where.report_date = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    // Replace with your actual query
    const data = await prisma.daily_reports.findMany({
      where,
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true }
        },
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true }
        }
      },
      orderBy: { report_date: 'desc' }
    });

    res.json(data);
  } catch (error) {
    console.error("Error fetching report data:", error);
    res.status(500).json({ error: "Failed to fetch report data" });
  }
};
