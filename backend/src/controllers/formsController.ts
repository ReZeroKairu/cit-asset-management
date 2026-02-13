import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lab Request Controllers
export const createLabRequest = async (req: Request, res: Response) => {
  try {
    const {
      date,
      usage_type,
      faculty_student_name,
      year_level,
      laboratory,
      printing_pages,
      ws_number,
      time_in,
      time_out,
      purpose,
      requested_by,
      approved_by,
      remarks,
      monitored_by,
      user_id
    } = req.body;

    const labRequest = await prisma.lab_requests.create({
      data: {
        date: new Date(date),
        usage_type,
        faculty_student_name,
        year_level,
        laboratory,
        printing_pages,
        ws_number,
        time_in,
        time_out,
        purpose,
        requested_by,
        approved_by,
        remarks,
        monitored_by,
        user_id: user_id || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Lab request submitted successfully',
      data: labRequest
    });
  } catch (error) {
    console.error('Error creating lab request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit lab request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getLabRequests = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    const whereClause: any = {};
    if (start_date || end_date) {
      whereClause.date = {};
      if (start_date) {
        whereClause.date.gte = new Date(start_date as string);
      }
      if (end_date) {
        whereClause.date.lte = new Date(end_date as string);
      }
    }

    const labRequests = await prisma.lab_requests.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            full_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: labRequests
    });
  } catch (error) {
    console.error('Error fetching lab requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateLabRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Handle both old "Rejected" and new "Denied" status for backward compatibility
    let validStatus = status;
    if (status === 'Denied') {
      validStatus = 'Rejected'; // Temporarily map Denied to Rejected until DB is updated
    }

    const labRequest = await prisma.lab_requests.update({
      where: { request_id: parseInt(id as string) },
      data: { status: validStatus }
    });

    res.json({
      success: true,
      message: 'Lab request status updated successfully',
      data: labRequest
    });
  } catch (error) {
    console.error('❌ Error updating lab request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lab request status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update lab request details (for custodian editing)
export const updateLabRequestDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { time_out, remarks } = req.body;

    console.log('🔧 Updating lab request details:', { id, time_out, remarks });

    const labRequest = await prisma.lab_requests.update({
      where: { request_id: parseInt(id as string) },
      data: { 
        time_out: time_out || null,
        remarks: remarks || null
      }
    });

    console.log('✅ Lab request details updated successfully:', labRequest);

    res.status(200).json({
      success: true,
      message: 'Lab request details updated successfully',
      data: labRequest
    });
  } catch (error) {
    console.error('❌ Error updating lab request details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lab request details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Equipment Borrow Controllers
export const createEquipmentBorrow = async (req: Request, res: Response) => {
  try {
    const {
      date,
      laboratory,
      faculty_student_name,
      year_level,
      release_time,
      returned_time,
      equipment_list,
      purpose,
      requested_by,
      approved_by,
      remarks,
      monitored_by,
      user_id
    } = req.body;

    const equipmentBorrow = await prisma.equipment_borrows.create({
      data: {
        date: new Date(date),
        laboratory,
        faculty_student_name,
        year_level,
        release_time,
        returned_time,
        equipment_list,
        purpose,
        requested_by,
        approved_by,
        remarks,
        monitored_by,
        user_id: user_id || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Equipment borrow request submitted successfully',
      data: equipmentBorrow
    });
  } catch (error) {
    console.error('Error creating equipment borrow request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit equipment borrow request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getEquipmentBorrows = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    const whereClause: any = {};
    if (start_date || end_date) {
      whereClause.date = {};
      if (start_date) {
        whereClause.date.gte = new Date(start_date as string);
      }
      if (end_date) {
        whereClause.date.lte = new Date(end_date as string);
      }
    }

    const equipmentBorrows = await prisma.equipment_borrows.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            full_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: equipmentBorrows
    });
  } catch (error) {
    console.error('Error fetching equipment borrows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment borrows',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateEquipmentBorrowStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Handle both old "Rejected" and new "Denied" status for backward compatibility
    let validStatus = status;
    if (status === 'Denied') {
      validStatus = 'Rejected'; // Temporarily map Denied to Rejected until DB is updated
    }

    const equipmentBorrow = await prisma.equipment_borrows.update({
      where: { borrow_id: parseInt(id as string) },
      data: { status: validStatus }
    });

    res.json({
      success: true,
      message: 'Equipment borrow status updated successfully',
      data: equipmentBorrow
    });
  } catch (error) {
    console.error('❌ Error updating equipment borrow status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment borrow status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update equipment borrow details (for custodian editing)
export const updateEquipmentBorrowDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { returned_time, remarks } = req.body;

    console.log('🔧 Updating equipment borrow details:', { id, returned_time, remarks });

    const equipmentBorrow = await prisma.equipment_borrows.update({
      where: { borrow_id: parseInt(id as string) },
      data: { 
        returned_time: returned_time || null,
        remarks: remarks || null
      }
    });

    console.log('✅ Equipment borrow details updated successfully:', equipmentBorrow);

    res.status(200).json({
      success: true,
      message: 'Equipment borrow details updated successfully',
      data: equipmentBorrow
    });
  } catch (error) {
    console.error('❌ Error updating equipment borrow details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment borrow details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Software Installation Controllers
export const createSoftwareInstallation = async (req: Request, res: Response) => {
  try {
    const {
      faculty_name,
      date,
      laboratory,
      software_list,
      requested_by,
      installation_remarks,
      prepared_by,
      feedback_date,
      user_id
    } = req.body;

    const softwareInstallation = await prisma.software_installations.create({
      data: {
        faculty_name,
        date: new Date(date),
        laboratory,
        software_list,
        requested_by,
        installation_remarks,
        prepared_by,
        feedback_date: feedback_date ? new Date(feedback_date) : null,
        user_id: user_id || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Software installation request submitted successfully',
      data: softwareInstallation
    });
  } catch (error) {
    console.error('Error creating software installation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit software installation request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSoftwareInstallations = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    const whereClause: any = {};
    if (start_date || end_date) {
      whereClause.date = {};
      if (start_date) {
        whereClause.date.gte = new Date(start_date as string);
      }
      if (end_date) {
        whereClause.date.lte = new Date(end_date as string);
      }
    }

    const softwareInstallations = await prisma.software_installations.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            full_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: softwareInstallations
    });
  } catch (error) {
    console.error('Error fetching software installations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch software installations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateSoftwareInstallationStatus = async (req: Request, res: Response) => {
  console.log('🚀 updateSoftwareInstallationStatus called!');
  console.log('📥 Request params:', req.params);
  console.log('📥 Request body:', req.body);
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Handle both old "Rejected" and new "Denied" status for backward compatibility
    let validStatus = status;
    if (status === 'Denied') {
      validStatus = 'Rejected'; // Temporarily map Denied to Rejected until DB is updated
    }

    // Try raw SQL first to bypass any Prisma issues
    try {
      const result = await prisma.$queryRaw`
        UPDATE software_installations 
        SET status = ${validStatus} 
        WHERE id = ${parseInt(id as string)}
      `;
      
      res.status(200).json({
        success: true,
        message: 'Software installation status updated successfully',
        data: result
      });
    } catch (rawSqlError) {
      console.error('❌ Raw SQL failed, trying Prisma:', rawSqlError);
      
      // Fallback to Prisma
      const softwareInstallation = await prisma.software_installations.update({
        where: { id: parseInt(id as string) },
        data: { status: validStatus }
      });

      res.status(200).json({
        success: true,
        message: 'Software installation status updated successfully',
        data: softwareInstallation
      });
    }

  } catch (error) {
    console.error('❌ Error updating software installation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update software installation status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateSoftwareInstallationDetails = async (req: Request, res: Response) => {
  console.log('🚀 updateSoftwareInstallationDetails called!');
  console.log('📥 Request params:', req.params);
  console.log('📥 Request body:', req.body);
  try {
    const { id } = req.params;
    const { installation_remarks, feedback_date } = req.body;

    // Build update data object
    const updateData: any = {};
    
    if (installation_remarks !== undefined) {
      updateData.installation_remarks = installation_remarks;
    }
    
    if (feedback_date !== undefined) {
      updateData.feedback_date = feedback_date ? new Date(feedback_date) : null;
    }

    console.log('📝 Update data:', updateData);

    // Update software installation details
    const softwareInstallation = await prisma.software_installations.update({
      where: { id: parseInt(id as string) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Software installation details updated successfully',
      data: softwareInstallation
    });

  } catch (error) {
    console.error('❌ Error updating software installation details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update software installation details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
