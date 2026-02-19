import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const resolveCustodianUserIdByLaboratory = async (laboratory: string | null | undefined) => {
  if (!laboratory) return null;

  const raw = String(laboratory).trim();
  if (!raw) return null;

  const candidates = Array.from(
    new Set([
      raw,
      raw.replace(/-/g, ' '),
      raw.replace(/\s+/g, ' '),
      raw.replace(/-/g, ' ').replace(/\s+/g, ' '),
    ]),
  );

  const lab = await prisma.laboratories.findFirst({
    where: {
      OR: candidates.map((name) => ({ lab_name: name })),
    },
    select: {
      lab_id: true,
      lab_name: true,
    },
  });

  if (!lab?.lab_id) return null;

  const custodian = await prisma.users.findFirst({
    where: {
      lab_id: lab.lab_id,
      role: 'Custodian',
    },
    select: {
      user_id: true,
    },
  });

  return custodian?.user_id ?? null;
};

// Public Lab Request Controller (no authentication required)
export const createPublicLabRequest = async (req: Request, res: Response) => {
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
      remarks,
      monitored_by
    } = req.body;

    const custodianUserId = await resolveCustodianUserIdByLaboratory(laboratory);

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
        remarks,
        monitored_by,
        user_id: custodianUserId, // Associate to custodian for retrieval (fallback null if not found)
        status: 'Pending' // Default status for public submissions
      }
    });

    res.status(201).json({
      success: true,
      message: 'Lab request submitted successfully',
      data: labRequest
    });
  } catch (error) {
    console.error('Error creating public lab request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit lab request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Public Equipment Borrow Controller (no authentication required)
export const createPublicEquipmentBorrow = async (req: Request, res: Response) => {
  try {
    const {
      date,
      faculty_student_name,
      year_level,
      laboratory,
      equipment_list,
      purpose,
      release_time,
      returned_time,
      requested_by,
      remarks,
      monitored_by
    } = req.body;

    const custodianUserId = await resolveCustodianUserIdByLaboratory(laboratory);

    const equipmentBorrow = await prisma.equipment_borrows.create({
      data: {
        date: new Date(date),
        faculty_student_name,
        year_level,
        laboratory,
        equipment_list: equipment_list || [],
        purpose,
        release_time,
        returned_time,
        requested_by,
        remarks,
        monitored_by,
        user_id: custodianUserId, // Associate to custodian for retrieval (fallback null if not found)
        status: 'Pending' // Default status for public submissions
      }
    });

    res.status(201).json({
      success: true,
      message: 'Equipment borrow request submitted successfully',
      data: equipmentBorrow
    });
  } catch (error) {
    console.error('Error creating public equipment borrow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit equipment borrow request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Public Software Installation Controller (no authentication required)
export const createPublicSoftwareInstallation = async (req: Request, res: Response) => {
  try {
    const {
      date,
      faculty_name,
      laboratory,
      software_list,
      requested_by,
      installation_remarks,
      prepared_by
    } = req.body;

    const custodianUserId = await resolveCustodianUserIdByLaboratory(laboratory);

    const softwareInstallation = await prisma.software_installations.create({
      data: {
        date: new Date(date),
        faculty_name,
        laboratory,
        software_list,
        requested_by,
        installation_remarks,
        prepared_by,
        user_id: custodianUserId, // Associate to custodian for retrieval (fallback null if not found)
        status: 'Pending' // Default status for public submissions
      }
    });

    res.status(201).json({
      success: true,
      message: 'Software installation request submitted successfully',
      data: softwareInstallation
    });
  } catch (error) {
    console.error('Error creating public software installation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit software installation request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
