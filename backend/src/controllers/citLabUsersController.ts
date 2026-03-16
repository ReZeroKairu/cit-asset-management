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

// Get CIT Lab Users logs (authentication required)
export const getCITLabUsersLogs = async (req: Request, res: Response) => {
  try {
    const {
      start_date,
      end_date,
      laboratory,
      user_type,
      search
    } = req.query;

    // Build where clause for filtering
    const where: any = {};
    
    if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date.gte = new Date(start_date as string);
      if (end_date) where.date.lte = new Date(end_date as string);
    }
    
    if (laboratory) {
      where.laboratory = laboratory;
    }
    
    if (user_type) {
      where.user_type = user_type === 'student' ? 'Student' : 'Faculty';
    }
    
    if (search) {
      where.OR = [
        { faculty_student_name: { contains: search } },
        { laboratory: { contains: search } },
        { purpose: { contains: search } }
      ];
    }

    const logs = await prisma.cit_lab_logs.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error fetching CIT Lab Users logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab usage logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get workstations for a specific lab
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
        lab_id: parseInt(lab_id)
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
