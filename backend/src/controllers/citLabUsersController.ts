import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';

const prisma = new PrismaClient();

// CIT Lab Users Controller (no authentication required)
export const createCITLabUser = async (req: Request, res: Response) => {
  try {
    const {
      date,
      time_in,
      time_out,
      usage_type,
      faculty_student_name,
      user_type,
      year_level,
      laboratory,
      ws_number,
      purpose,
      monitored_by
    } = req.body;

    console.log('📥 CIT Lab Users request data:', req.body);

    // Basic validation
    const validationErrors = [];
    
    console.log('🔍 Validating CIT Lab Users data:');
    console.log('  - date:', date);
    console.log('  - time_in:', time_in);
    console.log('  - time_out:', time_out);
    console.log('  - usage_type:', usage_type);
    console.log('  - faculty_student_name:', faculty_student_name);
    console.log('  - user_type:', user_type);
    console.log('  - laboratory:', laboratory);
    console.log('  - purpose:', purpose);
    console.log('  - year_level:', year_level);
    console.log('  - ws_number:', ws_number);
    console.log('  - monitored_by:', monitored_by);
    
    if (!date) {
      validationErrors.push('Date is required');
      console.log('❌ Date validation failed');
    }
    if (!time_in) {
      validationErrors.push('Time in is required');
      console.log('❌ Time in validation failed');
    }
    if (!usage_type) {
      validationErrors.push('Usage type is required');
      console.log('❌ Usage type validation failed');
    }
    if (!faculty_student_name) {
      validationErrors.push('Name is required');
      console.log('❌ Name validation failed');
    }
    if (!user_type) {
      validationErrors.push('User type is required');
      console.log('❌ User type validation failed');
    }
    if (!laboratory) {
      validationErrors.push('Laboratory is required');
      console.log('❌ Laboratory validation failed');
    }
    if (!purpose) {
      validationErrors.push('Purpose is required');
      console.log('❌ Purpose validation failed');
    }
    
    if (faculty_student_name && faculty_student_name.length > 100) {
      validationErrors.push('Name must be less than 100 characters');
    }
    if (purpose && purpose.length > 500) {
      validationErrors.push('Purpose must be less than 500 characters');
    }
    if (faculty_student_name && !/^[a-zA-Z\s.-]+$/.test(faculty_student_name)) {
      validationErrors.push('Name contains invalid characters');
    }

    if (validationErrors.length > 0) {
      console.error('❌ Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    console.log('✅ Validation passed');

    const citLabLog = await prisma.cit_lab_logs.create({
      data: {
        date: new Date(date),
        time_in,
        time_out: time_out || null,
        usage_type,
        faculty_student_name,
        user_type: user_type,
        year_level: year_level || null,
        laboratory,
        ws_number,
        purpose,
        monitored_by,
      }
    });

    res.status(201).json({
      success: true,
      message: 'CIT Lab Users log submitted successfully',
      data: citLabLog
    });
  } catch (error) {
    console.error('Error creating CIT Lab Users log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit lab usage log',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get CIT Lab Users logs (authentication required) - Using optimized view
export const getCITLabUsersLogs = async (req: Request, res: Response) => {
  try {
    const {
      start_date,
      end_date,
      laboratory,
      user_type,
      search,
      limit,
      offset
    } = req.query;

    console.log('?? Fetching CIT Lab Users logs with filters:', req.query);

    // Build where clause for filtering using the view
    let whereClause = '';
    const params: any[] = [];
    
    // Add parameter index tracking
    let paramIndex = 1;

    // Date range filtering
    if (start_date || end_date) {
      if (start_date && end_date) {
        whereClause += ` AND reservation_date BETWEEN ? AND ? `;
        params.push(start_date, end_date);
        paramIndex += 2;
      } else if (start_date) {
        whereClause += ` AND reservation_date >= ? `;
        params.push(start_date);
        paramIndex += 1;
      } else if (end_date) {
        whereClause += ` AND reservation_date <= ? `;
        params.push(end_date);
        paramIndex += 1;
      }
    }
    
    // Laboratory filtering
    if (laboratory && laboratory !== 'all') {
      whereClause += ` AND laboratory_display = ? `;
      params.push(laboratory);
      paramIndex += 1;
    }
    
    // User type filtering
    if (user_type && user_type !== 'all') {
      const userTypeValue = user_type === 'student' ? 'Student' : 'Faculty';
      whereClause += ` AND user_type_category = ? `;
      params.push(userTypeValue);
      paramIndex += 1;
    }
    
    // Search filtering (using optimized searchable_text field)
    if (search) {
      whereClause += ` AND searchable_text LIKE ? `;
      params.push(`%${search}%`);
      paramIndex += 1;
    }

    // Add pagination
    const limitClause = limit ? ` LIMIT ? ` : '';
    const offsetClause = offset ? ` OFFSET ? ` : '';
    if (limit) params.push(parseInt(limit as string));
    if (offset) params.push(parseInt(offset as string));

    // Remove the initial ' AND ' if whereClause is not empty
    const finalWhereClause = whereClause ? `WHERE ${whereClause.substring(5)}` : '';

    const query = `
      SELECT 
        log_id,
        date,
        time_in,
        time_out,
        usage_type,
        faculty_student_name,
        year_level,
        laboratory,
        ws_number,
        purpose,
        monitored_by,
        user_type,
        created_at,
        reservation_date,
        reservation_date_formatted,
        usage_type_display,
        user_type_category,
        laboratory_display,
        searchable_text
      FROM cit_lab_users_logs_view 
      ${finalWhereClause}
      ORDER BY created_at DESC 
      ${limitClause}
      ${offsetClause}
    `;

    console.log('?? Executing optimized query:', query);
    console.log('?? Query parameters:', params);

    const logs = await prisma.$queryRawUnsafe(query, ...params) as any[];
    console.log('?? View query successful, got', logs.length, 'records');

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM cit_lab_users_logs_view 
      ${finalWhereClause}
    `;
    
    console.log('?? Count query:', countQuery);
    const countResult = await prisma.$queryRawUnsafe(countQuery, ...params.slice(0, paramIndex - 1)) as any[];
    const totalCount = Number(countResult[0]?.total) || 0;
    console.log('?? Count query successful, total:', totalCount);

    // Convert BigInt values to regular numbers to prevent serialization errors
    const serializedLogs = logs.map(log => {
      const serializedLog: any = {};
      for (const key in log) {
        const value = log[key];
        if (typeof value === 'bigint') {
          serializedLog[key] = Number(value);
        } else {
          serializedLog[key] = value;
        }
      }
      return serializedLog;
    });

    res.status(200).json({
      success: true,
      data: serializedLogs,
      count: logs.length,
      total: Number(totalCount),
      message: `Retrieved ${logs.length} CIT Lab Users logs successfully`
    });
  } catch (error) {
    console.error('?? Error fetching CIT Lab Users logs:', error);
    console.error('?? Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      query: req.query,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CIT Lab Users logs',
      error: (error as Error).message,
      details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
};

// Get workstations for a specific lab (used by public forms)
export const getLabWorkstations = async (req: Request, res: Response) => {
  try {
    const lab_id = req.params.lab_id as string; // Type assertion to ensure it's a string
    
    if (!lab_id || isNaN(Number(lab_id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid lab ID is required'
      });
    }

    const workstations = await prisma.workstations.findMany({
      where: {
        lab_id: parseInt(lab_id),
        workstation_name: {
          not: {
            contains: 'Server'
          }
        }
      },
      select: {
        workstation_id: true,
        workstation_name: true,
        status_id: true,
        workstation_remarks: true
      },
      orderBy: {
        workstation_name: 'asc'
      }
    });

    // Apply natural sorting to ensure proper numerical order (WS-PC1, WS-PC2, WS-PC10)
    workstations.sort((a, b) => {
      const extractNumber = (name: string) => {
        const match = name.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const numA = extractNumber(a.workstation_name);
      const numB = extractNumber(b.workstation_name);
      
      if (numA !== numB) {
        return numA - numB;
      }
      
      // Fallback to alphabetical if numbers are the same
      return a.workstation_name.localeCompare(b.workstation_name);
    });

    res.status(200).json({
      success: true,
      data: workstations,
      count: workstations.length
    });
  } catch (error) {
    console.error('Error fetching lab workstations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab workstations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get CIT Lab Users analytics and statistics
export const getCITLabUsersAnalytics = async (req: Request, res: Response) => {
  try {
    const { 
      laboratory, 
      start_date, 
      end_date,
      group_by = 'laboratory' // laboratory, usage_type, user_type, month, day_of_week
    } = req.query;

    console.log('?? Fetching CIT Lab Users analytics with filters:', req.query);

    // Build where clause for filtering
    let whereClause = '';
    const params: any[] = [];
    
    if (start_date || end_date) {
      if (start_date && end_date) {
        whereClause += ' AND reservation_date BETWEEN ? AND ? ';
        params.push(start_date, end_date);
      } else if (start_date) {
        whereClause += ' AND reservation_date >= ? ';
        params.push(start_date);
      } else if (end_date) {
        whereClause += ' AND reservation_date <= ? ';
        params.push(end_date);
      }
    }
    
    if (laboratory && laboratory !== 'all') {
      whereClause += ' AND laboratory_display = ? ';
      params.push(laboratory);
    }

    const finalWhereClause = whereClause ? `WHERE ${whereClause.substring(5)}` : '';

    let groupByField = '';
    switch (group_by) {
      case 'usage_type':
        groupByField = 'usage_type_display';
        break;
      case 'user_type':
        groupByField = 'user_type_category';
        break;
      case 'month':
        groupByField = 'MONTHNAME(reservation_date), YEAR(reservation_date)';
        break;
      case 'day_of_week':
        groupByField = 'DAYOFWEEK(reservation_date)';
        break;
      case 'time_of_day':
        groupByField = 'HOUR(created_at)';
        break;
      default:
        groupByField = 'laboratory_display';
    }

    const analyticsQuery = `
      SELECT 
        ${groupByField},
        COUNT(*) as total_logs,
        COUNT(DISTINCT faculty_student_name) as unique_users,
        SUM(CASE WHEN usage_type = 'set-in-reservation' THEN 1 ELSE 0 END) as lab_usage_count,
        MAX(created_at) as last_activity
      FROM cit_lab_users_logs_view 
      ${finalWhereClause}
      GROUP BY ${groupByField}
      ORDER BY total_logs DESC
    `;

    console.log('?? Executing analytics query:', analyticsQuery);
    console.log('?? Analytics parameters:', params);
    const analyticsData = await prisma.$queryRawUnsafe(analyticsQuery, ...params) as any[];

    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT faculty_student_name) as unique_users,
        COUNT(DISTINCT laboratory_display) as unique_laboratories,
        SUM(CASE WHEN usage_type = 'set-in-reservation' THEN 1 ELSE 0 END) as total_lab_usage,
        COUNT(DISTINCT reservation_date) as active_days
      FROM cit_lab_users_logs_view 
      ${finalWhereClause}
    `;

    console.log('?? Executing stats query:', statsQuery);
    const statsData = await prisma.$queryRawUnsafe(statsQuery, ...params) as any[];
    const stats = statsData[0] || {};
    console.log('?? Stats data:', stats);

    // Convert BigInt values to regular numbers to prevent serialization errors
    const serializedAnalyticsData = analyticsData.map(item => {
      const serializedItem: any = {};
      for (const key in item) {
        const value = item[key];
        if (typeof value === 'bigint') {
          serializedItem[key] = Number(value);
        } else {
          serializedItem[key] = value;
        }
      }
      return serializedItem;
    });

    res.status(200).json({
      success: true,
      data: {
        analytics: serializedAnalyticsData,
        statistics: {
          total_logs: parseInt(stats.total_logs) || 0,
          unique_users: parseInt(stats.unique_users) || 0,
          unique_laboratories: parseInt(stats.unique_laboratories) || 0,
          total_lab_usage: parseInt(stats.total_lab_usage) || 0,
          active_days: parseInt(stats.active_days) || 0
        },
        group_by: group_by
      },
      message: `Retrieved CIT Lab Users analytics grouped by ${group_by}`
    });
  } catch (error) {
    console.error('?? Error fetching CIT Lab Users analytics:', error);
    console.error('?? Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      query: req.query,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab usage analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get recent CIT Lab Users logs (optimized for dashboard)
export const getRecentCITLabUsersLogs = async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;

    console.log('?? Fetching recent CIT Lab Users logs with limit:', limit);

    const query = `
      SELECT 
        log_id,
        faculty_student_name,
        user_type_category,
        laboratory_display,
        usage_type_display,
        purpose,
        reservation_date_formatted,
        created_at
      FROM cit_lab_users_logs_view
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
      ORDER BY created_at DESC
      LIMIT ?
    `;

    console.log('?? Executing recent logs query:', query);
    const logs = await prisma.$queryRawUnsafe(query, parseInt(limit as string)) as any[];
    console.log('?? Recent logs query successful, got', logs.length, 'records');

    // Convert BigInt values to regular numbers to prevent serialization errors
    const serializedLogs = logs.map(log => {
      const serializedLog: any = {};
      for (const key in log) {
        const value = log[key];
        if (typeof value === 'bigint') {
          serializedLog[key] = Number(value);
        } else {
          serializedLog[key] = value;
        }
      }
      return serializedLog;
    });

    res.status(200).json({
      success: true,
      data: serializedLogs,
      count: logs.length,
      message: `Retrieved ${logs.length} recent CIT Lab Users logs`
    });
  } catch (error) {
    console.error('?? Error fetching recent CIT Lab Users logs:', error);
    console.error('?? Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      query: req.query,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent lab usage logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
