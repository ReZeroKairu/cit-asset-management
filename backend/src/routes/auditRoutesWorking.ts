import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Simple working audit route
router.get('/', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = (page - 1) * limit;
    
    const action = req.query.action as string;
    const search = req.query.search as string;
    
    try {
      // Simple SQL query that uses the audit_logs_view
      let sql = `
        SELECT 
          al.id,
          al.user_id,
          al.action,
          al.description,
          al.created_at,
          al.user_name,
          al.user_email,
          al.user_role,
          al.user_type,
          al.log_date,
          al.log_time,
          al.formatted_timestamp,
          al.formatted_date,
          al.formatted_time,
          al.user_lab_name,
          al.user_lab_location,
          al.action_category,
          al.priority_level,
          al.searchable_text
        FROM audit_logs_view al
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      // Add filters
      if (action) {
        sql += ` AND al.action = ?`;
        params.push(action);
      }
      
      if (search) {
        sql += ` AND (
          LOWER(al.action) LIKE LOWER(?) OR
          LOWER(al.description) LIKE LOWER(?) OR
          LOWER(al.user_email) LIKE LOWER(?) OR
          LOWER(al.user_name) LIKE LOWER(?) OR
          LOWER(al.user_role) LIKE LOWER(?) OR
          LOWER(al.searchable_text) LIKE LOWER(?)
        )`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      sql += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      // Execute main query
      const results = await prisma.$queryRawUnsafe(sql, ...params) as any[];
      
      // Count query
      let countSql = `
        SELECT COUNT(*) as total
        FROM audit_logs_view al
        WHERE 1=1
      `;
      
      const countParams: any[] = [];
      
      if (action) {
        countSql += ` AND al.action = ?`;
        countParams.push(action);
      }
      
      if (search) {
        countSql += ` AND (
          LOWER(al.action) LIKE LOWER(?) OR
          LOWER(al.description) LIKE LOWER(?) OR
          LOWER(al.user_email) LIKE LOWER(?) OR
          LOWER(al.user_name) LIKE LOWER(?) OR
          LOWER(al.user_role) LIKE LOWER(?) OR
          LOWER(al.searchable_text) LIKE LOWER(?)
        )`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      const countResult = await prisma.$queryRawUnsafe(countSql, ...countParams) as any[];
      const total = countResult[0].total;
      
      // Format results - view already provides formatted data
      const logs = results;
      
      res.json({
        logs,
        total,
        page,
        limit,
        filters: { action: action || '', search: search || '' }
      });
      
    } catch (error) {
      console.error('❌ Database error:', error);
      res.status(500).json({ 
        error: 'Database query failed', 
        details: (error as Error).message 
      });
    }
  } catch (error) {
    console.error('❌ General error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
