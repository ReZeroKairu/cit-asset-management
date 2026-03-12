import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  static async logAction(data: {
    userId?: number;
    action: string;
    entityType: string;
    entityId?: number;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }) {
    const auditData: any = {
      action: data.action,
      description: data.description || `${data.action} ${data.entityType}${data.entityId ? ` #${data.entityId}` : ''}`
    };

    // Only include user_id if we have a valid user
    if (data.userId) {
      auditData.user_id = data.userId;
    }

    return await (prisma as any).audit_logs.create({
      data: auditData
    });
  }

  static async getAuditLogs(filters: {
    userId?: number;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    search?: string;
    actionCategory?: string;
    userRole?: string;
  }) {
    try {
      const { page = 1, limit = 50, userId, action, entityType, startDate, endDate, search, actionCategory, userRole } = filters;
      
      console.log('🔍 AuditService.getAuditLogs called with filters:', filters);
      
      // Build where clause using the view for better performance
      const where: any = {};
      if (userId) where.user_id = userId;
      if (action) where.action = action;
      if (entityType) where.entityType = entityType;
      if (search) where.search = search;
      if (actionCategory) where.action_category = actionCategory;
      if (userRole) where.user_role = userRole;
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.gte = startDate;
        if (endDate) where.created_at.lte = endDate;
      }
      
      // Use the audit_logs_view for optimized performance
      const hasFilters = Object.keys(where).length > 0;
      
      const whereClause = hasFilters ? this.buildWhereClause(where) : '1=1';
      
      // Build parameters in the correct order
      const whereParams: any[] = [];
      if (where.user_id) whereParams.push(where.user_id);
      if (where.action) whereParams.push(where.action);
      if (where.search) whereParams.push(`%${where.search}%`);
      if (where.action_category) whereParams.push(where.action_category);
      if (where.user_role) whereParams.push(where.user_role);
      if (where.created_at?.gte) whereParams.push(where.created_at.gte);
      if (where.created_at?.lte) whereParams.push(where.created_at.lte);
      
      const allParams = [...whereParams, limit, (page - 1) * limit];
      
      const [logs, total] = await Promise.all([
        prisma.$queryRawUnsafe(`
          SELECT 
            id, user_id, action, description, created_at,
            log_date, log_time, formatted_timestamp, formatted_date, formatted_time,
            user_name, user_email, user_role, user_lab_name, user_lab_location,
            user_type, action_category, priority_level, searchable_text
          FROM audit_logs_view 
          WHERE ${whereClause}
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `, ...allParams),
        
        prisma.$queryRawUnsafe(`
          SELECT CAST(COUNT(*) AS SIGNED INTEGER) as total
          FROM audit_logs_view 
          WHERE ${whereClause}
        `, ...whereParams)
      ]);

      // Convert BigInt to regular number if needed
      const totalResult = Array.isArray(total) && total.length > 0 ? total[0] : { total: 0 };
      const totalCount = typeof totalResult.total === 'bigint' ? Number(totalResult.total) : totalResult.total;

      console.log('📊 AuditService result:', { logsCount: (logs as any[]).length, total });

      return { logs: logs as any[], total: totalCount, page, limit };
    } catch (error) {
      console.error('❌ AuditService.getAuditLogs error:', error);
      // Return empty result on database error
      return { logs: [], total: 0, page: filters.page || 1, limit: filters.limit || 50 };
    }
  }

  private static buildWhereClause(where: any): string {
    const conditions: string[] = [];
    
    if (where.user_id) {
      conditions.push('user_id = ?');
    }
    if (where.action) {
      conditions.push('action = ?');
    }
    if (where.search) {
      conditions.push('searchable_text LIKE ?');
    }
    if (where.action_category) {
      conditions.push('action_category = ?');
    }
    if (where.user_role) {
      conditions.push('user_role = ?');
    }
    if (where.created_at?.gte) {
      conditions.push('created_at >= ?');
    }
    if (where.created_at?.lte) {
      conditions.push('created_at <= ?');
    }
    
    return conditions.join(' AND ');
  }

  static async getAuditLogsByUser(userId: number, limit: number = 50) {
    try {
      // Use the user_audit_logs_view which includes ranking
      const logs = await prisma.$queryRawUnsafe(`
        SELECT 
          id, user_id, action, description, created_at,
          log_date, log_time, formatted_timestamp, formatted_date, formatted_time,
          user_name, user_email, user_role, user_lab_name, user_lab_location,
          user_type, action_category, priority_level, searchable_text,
          CAST(user_action_rank AS SIGNED INTEGER) as user_action_rank
        FROM user_audit_logs_view 
        WHERE user_id = ?
        ORDER BY created_at DESC 
        LIMIT ?
      `, userId, limit) as any[];

      return logs;
    } catch (error) {
      console.error('❌ AuditService.getAuditLogsByUser error:', error);
      return [];
    }
  }

  // New method to get system audit logs
  static async getSystemAuditLogs(limit: number = 50) {
    try {
      const logs = await prisma.$queryRawUnsafe(`
        SELECT 
          id, user_id, action, description, created_at,
          log_date, log_time, formatted_timestamp, formatted_date, formatted_time,
          user_name, user_email, user_role, user_lab_name, user_lab_location,
          user_type, action_category, priority_level, searchable_text
        FROM system_audit_logs_view 
        ORDER BY created_at DESC 
        LIMIT ?
      `, limit) as any[];

      return logs;
    } catch (error) {
      console.error('❌ AuditService.getSystemAuditLogs error:', error);
      return [];
    }
  }

  // New method to get high priority audit logs
  static async getHighPriorityAuditLogs(limit: number = 50) {
    try {
      const logs = await prisma.$queryRawUnsafe(`
        SELECT 
          id, user_id, action, description, created_at,
          log_date, log_time, formatted_timestamp, formatted_date, formatted_time,
          user_name, user_email, user_role, user_lab_name, user_lab_location,
          user_type, action_category, priority_level, searchable_text
        FROM high_priority_audit_logs_view 
        ORDER BY created_at DESC 
        LIMIT ?
      `, limit) as any[];

      return logs;
    } catch (error) {
      console.error('❌ AuditService.getHighPriorityAuditLogs error:', error);
      return [];
    }
  }

  // New method to get recent audit logs
  static async getRecentAuditLogs(days: number = 30, limit: number = 50) {
    try {
      const logs = await prisma.$queryRawUnsafe(`
        SELECT 
          id, user_id, action, description, created_at,
          log_date, log_time, formatted_timestamp, formatted_date, formatted_time,
          user_name, user_email, user_role, user_lab_name, user_lab_location,
          user_type, action_category, priority_level, searchable_text
        FROM recent_audit_logs_view 
        ORDER BY created_at DESC 
        LIMIT ?
      `, limit) as any[];

      return logs;
    } catch (error) {
      console.error('❌ AuditService.getRecentAuditLogs error:', error);
      return [];
    }
  }

  // New method to get audit statistics
  static async getAuditStatistics() {
    try {
      const stats = await prisma.$queryRawUnsafe(`
        SELECT 
          user_type,
          action_category,
          COUNT(*) as count,
          MAX(created_at) as last_action
        FROM audit_logs_view 
        GROUP BY user_type, action_category
        ORDER BY count DESC
      `) as any[];

      return stats;
    } catch (error) {
      console.error('❌ AuditService.getAuditStatistics error:', error);
      return [];
    }
  }
}
