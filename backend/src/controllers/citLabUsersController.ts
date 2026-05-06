import { Request, Response } from "express";
import * as CITLabUsersService from "../services/citLabUsersService";

const getClientIP = (req: any) => {
  return (
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
    req.ip
  );
};

export const createCITLabUser = async (req: Request, res: Response) => {
  try {
    const citLabLog = await CITLabUsersService.createCITLabUser(
      req.body,
      getClientIP(req),
    );
    res
      .status(201)
      .json({
        success: true,
        message: "CIT Lab Users log submitted successfully",
        data: citLabLog,
      });
  } catch (error: any) {
    if (error.message.includes("VALIDATION")) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Validation failed",
          error: error.message,
        });
    }
    console.error("Error creating CIT Lab Users log:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to submit lab usage log",
        error: error.message,
      });
  }
};

export const getCITLabUsersLogs = async (req: Request, res: Response) => {
  try {
    const { logs, total } = await CITLabUsersService.getCITLabUsersLogs(
      req.query,
    );
    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length,
      total,
      message: `Retrieved ${logs.length} CIT Lab Users logs successfully`,
    });
  } catch (error: any) {
    console.error("Error fetching CIT Lab Users logs:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch CIT Lab Users logs",
        error: error.message,
      });
  }
};

export const getLabWorkstations = async (req: Request, res: Response) => {
  try {
    const workstations = await CITLabUsersService.getLabWorkstations(
      req.params.lab_id as string,
    );
    res
      .status(200)
      .json({ success: true, data: workstations, count: workstations.length });
  } catch (error: any) {
    if (error.message.includes("VALIDATION"))
      return res.status(400).json({ success: false, message: error.message });
    console.error("Error fetching lab workstations:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch lab workstations",
        error: error.message,
      });
  }
};

export const getCITLabUsersAnalytics = async (req: Request, res: Response) => {
  try {
    const group_by = req.query.group_by || "laboratory";
    const data = await CITLabUsersService.getCITLabUsersAnalytics({
      ...req.query,
      group_by,
    });

    res.status(200).json({
      success: true,
      data: { ...data, group_by },
      message: `Retrieved CIT Lab Users analytics grouped by ${group_by}`,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch lab usage analytics",
        error: error.message,
      });
  }
};

export const getRecentCITLabUsersLogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await CITLabUsersService.getRecentCITLabUsersLogs(limit);

    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length,
      message: `Retrieved ${logs.length} recent CIT Lab Users logs`,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch recent lab usage logs",
        error: error.message,
      });
  }
};
