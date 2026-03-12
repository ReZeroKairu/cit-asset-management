import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Simple working audit route
router.get('/', authenticateToken, requireRole(['Admin', 'Custodian']), async (req, res) => {
  try {
    console.log('🔍 Audit route hit!', { query: req.query });
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = (page - 1) * limit;
    
    const action = req.query.action as string;
    const search = req.query.search as string;
    
    console.log('🔍 Parameters:', { page, limit, action: action || 'none', search: search || 'none' });
    
    try {
      // Simple SQL query that works
      let sql = `
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
          LOWER(COALESCE(u.email, '')) LIKE LOWER(?) OR
          LOWER(COALESCE(u.full_name, '')) LIKE LOWER(?) OR
          LOWER(COALESCE(u.role, '')) LIKE LOWER(?)
        )`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      sql += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      console.log('🔍 SQL:', sql);
      console.log('🔍 Params:', params);
      
      // Execute main query
      const results = await prisma.$queryRawUnsafe(sql, ...params) as any[];
      
      // Count query
      let countSql = `
        SELECT COUNT(*) as total
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
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
          LOWER(COALESCE(u.email, '')) LIKE LOWER(?) OR
          LOWER(COALESCE(u.full_name, '')) LIKE LOWER(?) OR
          LOWER(COALESCE(u.role, '')) LIKE LOWER(?)
        )`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      const countResult = await prisma.$queryRawUnsafe(countSql, ...countParams) as any[];
      const total = countResult[0].total;
      
      // Format results
      const logs = results.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        action: row.action,
        description: row.description,
        created_at: row.created_at,
        user: row.email ? {
          email: row.email,
          full_name: row.full_name || 'Unknown',
          role: row.role || 'Unknown'
        } : null
      }));
      
      console.log('📊 Results:', { found: logs.length, total });
      
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
