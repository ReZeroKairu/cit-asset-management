import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = Router();

// Enhanced audit service with filtering and search using view tables
router.get('/', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    // console.log('🔍 Enhanced audit route hit!', { user: req.user, query: req.query });
    
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
    
    // console.log('🔍 Extracted parameters:', { 
      // action: action || 'none', 
      // search: search || 'none', 
      // userId: userId || 'none',
      // actionCategory: actionCategory || 'none',
      // userRole: userRole || 'none',
      // startDate: startDate ? startDate.toISOString() : 'none',
      // endDate: endDate ? endDate.toISOString() : 'none',
      // page, 
      // limit 
    // });
    
    try {
      // console.log('🔍 Using optimized audit service with view tables...');
      
      // Use the enhanced AuditService with view tables
      const result = await AuditService.getAuditLogs({
        page,
        limit,
        userId,
        action,
        search,
        actionCategory,
        userRole,
        startDate,
        endDate
      });
      
      // console.log('📊 AuditService result:', { 
        // logsCount: (result.logs as any[]).length, 
        // total: result.total,
        // search: search || 'none'
      // });
      
      const response = {
        logs: result.logs as any[],
        total: result.total,
        page: result.page,
        limit: result.limit,
        filters: { action, search, userId, actionCategory, userRole, startDate, endDate }
      };
      
      // console.log('✅ Final result being sent:', response);
      res.json(response);
    } catch (error) {
      console.error('❌ Error in enhanced audit route:', error);
      res.status(500).json({ 
        error: 'Failed to fetch audit logs', 
        details: (error as Error).message 
      });
    }
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
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
    console.error('Failed to fetch recent audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch recent audit logs' });
  }
});

// New endpoint for audit statistics
router.get('/statistics', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    const stats = await AuditService.getAuditStatistics();
    
    res.json({ statistics: stats });
  } catch (error) {
    console.error('Failed to fetch audit statistics:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// Enhanced user-specific audit logs
router.get('/user/:userId', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId);
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    
    const logs = await AuditService.getAuditLogsByUser(userId, limit);
    
    res.json({ logs });
  } catch (error) {
    console.error('Failed to fetch user audit logs:', error);
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
    console.error('Failed to fetch system audit logs:', error);
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
    console.error('Failed to fetch high priority audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch high priority audit logs' });
  }
});

export default router;
