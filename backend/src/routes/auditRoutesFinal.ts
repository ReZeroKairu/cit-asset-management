import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Enhanced audit service with filtering and search
router.get('/', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    console.log('🔍 Enhanced audit route hit!', { user: req.user, query: req.query });
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 for performance
    const offset = (page - 1) * limit;
    
    // Extract filter parameters
    const action = req.query.action as string;
    const search = req.query.search as string;
    const userId = req.query.userId as string;
    
    console.log('🔍 Using enhanced queries with filters:', { action, search, userId });
    
    try {
      // Build where clause for filtering
      const whereClause: any = {};
      
      // Filter by action type
      if (action) {
        whereClause.action = action;
      }
      
      // Filter by specific user
      if (userId) {
        whereClause.user_id = parseInt(userId);
      }
      
      // Simple search - just filter by action and description for now
      if (search) {
        whereClause.OR = [
          { action: { contains: search } },
          { description: { contains: search } }
        ];
      }
      
      // Get filtered audit logs
      const logs = await (prisma as any).audit_logs.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit
      });
      
      // Get total count with same filters
      const total = await (prisma as any).audit_logs.count({
        where: whereClause
      });
      
      // Enrich logs with user information
      const enrichedLogs = await Promise.all(
        logs.map(async (log: any) => {
          if (log.user_id) {
            const user = await (prisma as any).users.findUnique({
              where: { user_id: log.user_id },
              select: {
                email: true,
                full_name: true,
                role: true
              }
            });
            return {
              ...log,
              user: user
            };
          }
          return {
            ...log,
            user: null
          };
        })
      );
      
      console.log('📊 Enhanced filtered result:', { 
        logsCount: enrichedLogs.length, 
        total, 
        filters: { action, search, userId } 
      });
      
      const result = {
        logs: enrichedLogs,
        total,
        page,
        limit,
        filters: { action, search, userId }
      };
      
      console.log('📊 Final enhanced result being sent:', result);
      res.json(result);
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

export default router;
