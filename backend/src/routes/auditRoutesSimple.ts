import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = Router();

// Enhanced audit service with filtering and search using view tables
router.get('/', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 for performance
    
    // Extract filter parameters
    const action = req.query.action as string;
    const search = req.query.search as string;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const actionCategory = req.query.actionCategory as string;
    const userRole = req.query.userRole as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Get current user info for role-based filtering
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.userId;
    
    try {
      // Use the enhanced AuditService with view tables and role-based filtering
      const result = await AuditService.getAuditLogs({
        page,
        limit,
        userId,
        action,
        search,
        actionCategory,
        userRole,
        startDate,
        endDate,
        currentUserRole, // Pass current user's role
        currentUserId    // Pass current user's ID
      });
      
      const response = {
        logs: result.logs as any[],
        total: result.total,
        page: result.page,
        limit: result.limit,
        filters: { action, search, userId, actionCategory, userRole, startDate, endDate }
      };
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch audit logs', 
        details: (error as Error).message 
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// New endpoint for recent audit logs
router.get('/recent', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    
    const logs = await AuditService.getRecentAuditLogs(days, limit);
    
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent audit logs' });
  }
});

// New endpoint for audit statistics
router.get('/statistics', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    const stats = await AuditService.getAuditStatistics();
    
    res.json({ statistics: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// Enhanced user-specific audit logs
router.get('/user/:userId', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId);
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    
    // Get current user info for role-based filtering
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.userId;
    
    const logs = await AuditService.getAuditLogsByUser(userId, limit, currentUserRole, currentUserId);
    
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user audit logs' });
  }
});

// New endpoint for system audit logs
router.get('/system', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    
    const logs = await AuditService.getSystemAuditLogs(limit);
    
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system audit logs' });
  }
});

// New endpoint for high priority audit logs
router.get('/high-priority', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    
    const logs = await AuditService.getHighPriorityAuditLogs(limit);
    
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch high priority audit logs' });
  }
});

export default router;
