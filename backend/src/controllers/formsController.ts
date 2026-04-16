import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        user_id: user_id || null,
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

    // Validate status against the enum
    const validStatuses = ['Pending', 'Custodian_Approved', 'Denied', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const softwareInstallation = await prisma.software_installations.update({
      where: { id: parseInt(id as string) },
      data: { status }
    });

    res.status(200).json({
      success: true,
      message: 'Software installation status updated successfully',
      data: softwareInstallation
    });

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
