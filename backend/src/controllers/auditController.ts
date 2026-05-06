import { Request, Response } from "express";
import { AuditService } from "../services/auditService";

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 10, 50),
      userId: req.query.userId
        ? parseInt(req.query.userId as string)
        : undefined,
      action: req.query.action as string,
      search: req.query.search as string,
      actionCategory: req.query.actionCategory as string,
      userRole: req.query.userRole as string,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
      currentUserRole: req.user?.role,
      currentUserId: req.user?.userId,
    };

    const result = await AuditService.getAuditLogs(filters);
    res.json({
      logs: result.logs,
      total: result.total,
      page: result.page,
      limit: result.limit,
      filters,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch audit logs", details: error.message });
  }
};

export const getRecentAuditLogs = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const logs = await AuditService.getRecentAuditLogs(days, limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent audit logs" });
  }
};

export const getAuditStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await AuditService.getAuditStatistics();
    res.json({ statistics: stats });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit statistics" });
  }
};

export const getUserAuditLogs = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const logs = await AuditService.getAuditLogsByUser(
      userId,
      limit,
      req.user?.role,
      req.user?.userId,
    );
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user audit logs" });
  }
};

export const getSystemAuditLogs = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const logs = await AuditService.getSystemAuditLogs(limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch system audit logs" });
  }
};

export const getHighPriorityAuditLogs = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const logs = await AuditService.getHighPriorityAuditLogs(limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch high priority audit logs" });
  }
};
