import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Simple audit route with Prisma fallback when view fails
router.get('/', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = (page - 1) * limit;
    
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.userId;
    
    // Build where clause for role-based filtering
    let whereClause: any = {};
    
    // Role-based filtering: Custodians can see logs related to their assigned lab
    if (currentUserRole === 'Custodian' && currentUserId) {
      try {
        const custodian = await prisma.users.findUnique({
          where: { user_id: currentUserId },
          select: { lab_id: true }
        });
        
        if (custodian?.lab_id) {
          // Show logs for their lab (including their own actions)
          whereClause.OR = [
            { user_id: currentUserId }, // Their own actions
            { lab_id: custodian.lab_id, user_id: null } // System actions for their lab
          ];
        } else {
          // Fallback: only show their own logs if no lab assigned
          whereClause.user_id = currentUserId;
        }
      } catch (error) {
        whereClause.user_id = currentUserId;
      }
    }
    
    // Apply additional filters
    if (req.query.action) {
      whereClause.action = req.query.action;
    }
    if (req.query.search) {
      whereClause.OR = [
        { action: { contains: req.query.search as string } },
        { description: { contains: req.query.search as string } }
      ];
    }
    
    // Get total count and logs
    const [total, logs] = await Promise.all([
      prisma.audit_logs.count({ where: whereClause }),
      prisma.audit_logs.findMany({
        where: whereClause,
        include: {
          users: {
            select: {
              full_name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        skip: offset
      })
    ]);
    
    // Transform logs to match expected format
    const transformedLogs = logs.map(log => ({
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      description: log.description,
      created_at: log.created_at,
      user_name: log.users?.full_name || 'System',
      user_email: log.users?.email || null,
      user_role: log.users?.role || 'System',
      formatted_timestamp: log.created_at.toISOString()
    }));
    
    const response = {
      logs: transformedLogs,
      total,
      page,
      limit
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
