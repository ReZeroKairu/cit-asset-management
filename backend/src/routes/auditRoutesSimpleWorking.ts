import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Ultra-simple audit route that works
router.get('/', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = (page - 1) * limit;
    
    const action = req.query.action as string;
    const search = req.query.search as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // First get all logs with user data
    const allLogsQuery = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.description,
        al.created_at,
        u.email,
        u.full_name,
        u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ORDER BY al.created_at DESC
    `;
    
    const allLogs = await prisma.$queryRawUnsafe(allLogsQuery) as any[];
    
    // Filter in memory (simple and reliable)
    let filteredLogs = allLogs;
    
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    
    // Date filtering
    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= start;
      });
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include entire day
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate <= end;
      });
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        (log.action && log.action.toLowerCase().includes(searchLower)) ||
        (log.description && log.description.toLowerCase().includes(searchLower)) ||
        (log.email && log.email.toLowerCase().includes(searchLower)) ||
        (log.full_name && log.full_name.toLowerCase().includes(searchLower)) ||
        (log.role && log.role.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    
    // Format for frontend
    const formattedLogs = paginatedLogs.map(log => ({
      id: Number(log.id),
      user_id: log.user_id ? Number(log.user_id) : null,
      action: String(log.action || ''),
      description: String(log.description || ''),
      created_at: new Date(log.created_at).toISOString(),
      user: log.email ? {
        email: String(log.email),
        full_name: String(log.full_name || 'Unknown'),
        role: String(log.role || 'Unknown')
      } : null
    }));
    
    const result = {
      logs: formattedLogs,
      total: filteredLogs.length,
      page,
      limit,
      filters: { 
        action: action || '', 
        search: search || '',
        startDate: startDate || '',
        endDate: endDate || ''
      }
    };
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch audit logs',
      message: (error as Error).message
    });
  }
});

export default router;
