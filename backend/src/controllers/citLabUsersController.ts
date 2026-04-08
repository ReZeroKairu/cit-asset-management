import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';

const prisma = new PrismaClient();

// CIT Lab Users Controller (no authentication required)
export const createCITLabUser = async (req: Request, res: Response) => {
  try {
    // Capture client IP address with comprehensive fallbacks
    const clientIP = req.ip || 
                    req.headers['x-forwarded-for'] as string || 
                    req.headers['x-real-ip'] as string || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress || 
                    'Unknown';
    
    const {
      date,
      time_in,
      time_out,
      usage_type,
      faculty_student_name,
      user_type,
      year_level,
      laboratory,
      printing_pages,
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
    console.log('  - printing_pages:', printing_pages);
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
        year_level: year_level ? `${year_level} Year` : null,
        laboratory,
        printing_pages,
        ws_number,
        purpose,
        monitored_by,
        ip_address: clientIP
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

    // Build where clause for filtering using the view
    let whereClause = '';
    const params: any[] = [];
    
    // Add parameter index tracking
    let paramIndex = 1;

    // Date range filtering
    if (start_date || end_date) {
      if (start_date && end_date) {
        whereClause += ` AND log_date BETWEEN ? AND ? `;
        params.push(start_date, end_date);
        paramIndex += 2;
      } else if (start_date) {
        whereClause += ` AND log_date >= ? `;
        params.push(start_date);
        paramIndex += 1;
      } else if (end_date) {
        whereClause += ` AND log_date <= ? `;
        params.push(end_date);
        paramIndex += 1;
      }
    }
    
    // Laboratory filtering
    if (laboratory) {
      whereClause += ` AND laboratory_display = ? `;
      params.push(laboratory);
      paramIndex += 1;
    }
    
    // User type filtering
    if (user_type) {
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
        usage_type,
        faculty_student_name,
        year_level,
        laboratory,
        printing_pages,
        ws_number,
        purpose,
        monitored_by,
        user_type,
        ip_address,
        created_at,
        formatted_date,
        formatted_timestamp,
        formatted_created_date,
        formatted_created_time,
        usage_type_display,
        user_type_category,
        laboratory_display,
        year_level_display,
        ws_number_display,
        printing_pages_display,
        monitored_by_display,
        ip_address_display,
        usage_category,
        user_category,
        day_of_week,
        month_name,
        time_of_day
      FROM cit_lab_users_logs_view 
      ${finalWhereClause}
      ORDER BY created_at DESC
      ${limitClause}
      ${offsetClause}
    `;

    console.log('🔍 Executing optimized query:', query);
    console.log('🔍 Query parameters:', params);

    let logs, totalCount;
    
    try {
      // Try using the optimized view first
      console.log('🔍 Attempting to use cit_lab_users_logs_view...');
      console.log('🔍 Query:', query);
      console.log('🔍 Parameters:', params);
      
      logs = await prisma.$queryRawUnsafe(query, ...params) as any[];
      console.log('✅ View query successful, got', logs.length, 'records');

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM cit_lab_users_logs_view 
        ${finalWhereClause}
      `;
      
      console.log('🔍 Count query:', countQuery);
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...params.slice(0, paramIndex - 1)) as any[];
      totalCount = Number(countResult[0]?.total) || 0;
      console.log('✅ Count query successful, total:', totalCount);
      
    } catch (viewError) {
      console.log('❌ View query failed:', viewError);
      console.log('⚠️ View not found, falling back to raw table:', viewError instanceof Error ? viewError.message : 'Unknown error');
      
      // Build fallback where clause for raw table
      let fallbackWhereClause = '';
      const fallbackParams: any[] = [];
      let fallbackParamIndex = 1;
      
      // Date range filtering (using date field instead of log_date)
      if (start_date || end_date) {
        if (start_date && end_date) {
          fallbackWhereClause += ` AND date BETWEEN ? AND ? `;
          fallbackParams.push(start_date, end_date);
          fallbackParamIndex += 2;
        } else if (start_date) {
          fallbackWhereClause += ` AND date >= ? `;
          fallbackParams.push(start_date);
          fallbackParamIndex += 1;
        } else if (end_date) {
          fallbackWhereClause += ` AND date <= ? `;
          fallbackParams.push(end_date);
          fallbackParamIndex += 1;
        }
      }
      
      // Laboratory filtering
      if (laboratory) {
        fallbackWhereClause += ` AND laboratory = ? `;
        fallbackParams.push(laboratory);
        fallbackParamIndex += 1;
      }
      
      // User type filtering
      if (user_type) {
        const userTypeValue = user_type === 'student' ? 'Student' : 'Faculty';
        fallbackWhereClause += ` AND user_type = ? `;
        fallbackParams.push(userTypeValue);
        fallbackParamIndex += 1;
      }
      
      // Search filtering (search across multiple fields)
      if (search) {
        fallbackWhereClause += ` AND (
          faculty_student_name LIKE ? OR 
          laboratory LIKE ? OR 
          purpose LIKE ? OR 
          usage_type LIKE ? OR
          monitored_by LIKE ?
        ) `;
        const searchTerm = `%${search}%`;
        fallbackParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        fallbackParamIndex += 5;
      }
      
      // Add pagination
      const fallbackLimitClause = limit ? ` LIMIT ? ` : '';
      const fallbackOffsetClause = offset ? ` OFFSET ? ` : '';
      if (limit) fallbackParams.push(parseInt(limit as string));
      if (offset) fallbackParams.push(parseInt(offset as string));
      
      // Remove the initial ' AND ' if whereClause is not empty
      const finalFallbackWhereClause = fallbackWhereClause ? `WHERE ${fallbackWhereClause.substring(5)}` : '';
      
      // Fallback to raw table query
      const fallbackQuery = `
        SELECT 
          log_id,
          date,
          usage_type,
          faculty_student_name,
          year_level,
          laboratory,
          printing_pages,
          ws_number,
          purpose,
          monitored_by,
          user_type,
          ip_address,
          created_at
        FROM cit_lab_logs 
        ${finalFallbackWhereClause}
        ORDER BY created_at DESC
        ${fallbackLimitClause}
        ${fallbackOffsetClause}
      `;

      logs = await prisma.$queryRawUnsafe(fallbackQuery, ...fallbackParams) as any[];
      console.log('✅ Fallback query successful, got', logs.length, 'records');
      
      // Get total count for pagination
      const fallbackCountQuery = `
        SELECT COUNT(*) as total
        FROM cit_lab_logs 
        ${finalFallbackWhereClause}
      `;
      
      console.log('🔍 Fallback count query:', fallbackCountQuery);
      const countResult = await prisma.$queryRawUnsafe(fallbackCountQuery, ...fallbackParams.slice(0, fallbackParamIndex - 1)) as any[];
      totalCount = Number(countResult[0]?.total) || 0;
      console.log('✅ Fallback count query successful, total:', totalCount);
    }

    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length,
      total: Number(totalCount),
      message: `Retrieved ${logs.length} CIT Lab Users logs successfully`
    });
  } catch (error) {
    console.error('❌ Error fetching CIT Lab Users logs:', error);
    console.error('❌ Error details:', {
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

    // Build where clause for filtering
    let whereClause = '';
    const params: any[] = [];
    
    if (start_date || end_date) {
      if (start_date && end_date) {
        whereClause += ' AND log_date BETWEEN ? AND ? ';
        params.push(start_date, end_date);
      } else if (start_date) {
        whereClause += ' AND log_date >= ? ';
        params.push(start_date);
      } else if (end_date) {
        whereClause += ' AND log_date <= ? ';
        params.push(end_date);
      }
    }
    
    if (laboratory) {
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
        groupByField = 'month_name, year_number';
        break;
      case 'day_of_week':
        groupByField = 'day_of_week';
        break;
      case 'time_of_day':
        groupByField = 'time_of_day';
        break;
      default:
        groupByField = 'laboratory_display';
    }

    const analyticsQuery = `
      SELECT 
        ${groupByField},
        COUNT(*) as total_logs,
        COUNT(DISTINCT faculty_student_name) as unique_users,
        SUM(CASE WHEN usage_type = 'printing' THEN 1 ELSE 0 END) as printing_count,
        SUM(CASE WHEN usage_type = 'set-in-reservation' THEN 1 ELSE 0 END) as lab_usage_count,
        MAX(created_at) as last_activity
      FROM cit_lab_users_logs_view 
      ${finalWhereClause}
      GROUP BY ${groupByField}
      ORDER BY total_logs DESC
    `;

    console.log('📊 Executing analytics query:', analyticsQuery);
    const analyticsData = await prisma.$queryRawUnsafe(analyticsQuery, ...params) as any[];

    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT faculty_student_name) as unique_users,
        COUNT(DISTINCT laboratory_display) as unique_laboratories,
        SUM(CASE WHEN usage_type = 'printing' THEN 1 ELSE 0 END) as total_printing,
        SUM(CASE WHEN usage_type = 'set-in-reservation' THEN 1 ELSE 0 END) as total_lab_usage,
        COUNT(DISTINCT DATE(date)) as active_days
      FROM cit_lab_users_logs_view 
      ${finalWhereClause}
    `;

    const statsData = await prisma.$queryRawUnsafe(statsQuery, ...params) as any[];
    const stats = statsData[0] || {};

    res.status(200).json({
      success: true,
      data: {
        analytics: analyticsData,
        statistics: {
          total_logs: parseInt(stats.total_logs) || 0,
          unique_users: parseInt(stats.unique_users) || 0,
          unique_laboratories: parseInt(stats.unique_laboratories) || 0,
          total_printing: parseInt(stats.total_printing) || 0,
          total_lab_usage: parseInt(stats.total_lab_usage) || 0,
          active_days: parseInt(stats.active_days) || 0
        },
        group_by: group_by
      },
      message: `Retrieved CIT Lab Users analytics grouped by ${group_by}`
    });
  } catch (error) {
    console.error('Error fetching CIT Lab Users analytics:', error);
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

    const query = `
      SELECT 
        log_id,
        faculty_student_name,
        user_type_category,
        laboratory_display,
        usage_type_display,
        purpose,
        formatted_created_timestamp,
        time_of_day
      FROM cit_lab_users_logs_view
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const logs = await prisma.$queryRawUnsafe(query, parseInt(limit as string)) as any[];

    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length,
      message: `Retrieved ${logs.length} recent CIT Lab Users logs`
    });
  } catch (error) {
    console.error('Error fetching recent CIT Lab Users logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent lab usage logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
