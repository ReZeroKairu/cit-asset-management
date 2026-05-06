// src/services/formsService.ts
import { prisma } from "../config/database";

// Complex business logic moved safely out of the controller
const resolveCustodianUserIdByLaboratory = async (
  laboratory: string | null | undefined,
) => {
  if (!laboratory) return null;
  const raw = String(laboratory).trim();
  if (!raw) return null;

  const candidates = Array.from(
    new Set([
      raw,
      raw.replace(/-/g, " "),
      raw.replace(/\s+/g, " "),
      raw.replace(/-/g, " ").replace(/\s+/g, " "),
    ]),
  );

  const lab = await prisma.laboratories.findFirst({
    where: { OR: candidates.map((name) => ({ lab_name: name })) },
    select: { lab_id: true, lab_name: true },
  });

  if (!lab?.lab_id) return null;

  const custodian = await prisma.users.findFirst({
    where: { lab_id: lab.lab_id, role: "Custodian" },
    select: { user_id: true },
  });

  return custodian?.user_id ?? null;
};

export const createSoftwareInstallation = async (
  data: any,
  ipAddress: string | null,
  isPublic: boolean = false,
) => {
  let assignedUserId = data.user_id || null;
  let initialStatus: "Pending" | "Custodian_Approved" | "Denied" | "Completed" =
    "Pending";

  // If it's a public form, we must dynamically resolve the custodian ID based on the text string
  if (isPublic) {
    assignedUserId = await resolveCustodianUserIdByLaboratory(data.laboratory);
  }

  return prisma.software_installations.create({
    data: {
      faculty_name: data.faculty_name,
      date: new Date(data.date),
      laboratory: data.laboratory,
      software_list: data.software_list,
      requested_by: data.requested_by,
      user_type: data.user_type || null, // from public form
      installation_remarks: data.installation_remarks,
      prepared_by: data.prepared_by,
      feedback_date: data.feedback_date ? new Date(data.feedback_date) : null,
      user_id: assignedUserId,
      status: initialStatus,
      ip_address: ipAddress,
    },
  });
};

export const getSoftwareInstallations = async (filters: {
  start_date?: string;
  end_date?: string;
}) => {
  const whereClause: any = {};

  if (filters.start_date || filters.end_date) {
    whereClause.date = {};
    if (filters.start_date) whereClause.date.gte = new Date(filters.start_date);
    if (filters.end_date) whereClause.date.lte = new Date(filters.end_date);
  }

  return prisma.software_installations.findMany({
    where: whereClause,
    include: { users: { select: { full_name: true, email: true } } },
    orderBy: { created_at: "desc" },
  });
};

export const updateSoftwareInstallationStatus = async (
  id: number,
  status: string,
) => {
  const validStatuses = [
    "Pending",
    "Custodian_Approved",
    "Denied",
    "Completed",
  ];
  if (!validStatuses.includes(status)) {
    throw new Error(
      `VALIDATION: Status must be one of: ${validStatuses.join(", ")}`,
    );
  }

  return prisma.software_installations.update({
    where: { id },
    data: { status: status as "Pending" | "Custodian_Approved" | "Denied" | "Completed" },
  });
};

export const updateSoftwareInstallationDetails = async (
  id: number,
  data: any,
) => {
  const updateData: any = {};

  if (data.installation_remarks !== undefined) {
    updateData.installation_remarks = data.installation_remarks;
  }
  if (data.feedback_date !== undefined) {
    updateData.feedback_date = data.feedback_date
      ? new Date(data.feedback_date)
      : null;
  }

  return prisma.software_installations.update({
    where: { id },
    data: updateData,
  });
};
