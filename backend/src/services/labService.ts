import { prisma } from "../config/database";

export const getLaboratories = async () => {
  return prisma.laboratories.findMany({
    include: {
      users: {
        select: { user_id: true, full_name: true, email: true, role: true },
        where: { role: "Custodian" },
      },
      departments: { select: { dept_id: true, dept_name: true } },
    },
    orderBy: { lab_name: "asc" },
  });
};

export const createLaboratory = async (data: {
  lab_name: string;
  location?: string;
  dept_id?: string | number;
}) => {
  if (!data.lab_name)
    throw new Error("VALIDATION: Laboratory name is required");

  const existingLab = await prisma.laboratories.findFirst({
    where: { lab_name: data.lab_name },
  });
  if (existingLab)
    throw new Error("DUPLICATE: Laboratory with this name already exists");

  return prisma.laboratories.create({
    data: {
      lab_name: data.lab_name,
      location: data.location || null,
      dept_id: data.dept_id ? Number(data.dept_id) : null,
    },
  });
};

export const updateLaboratory = async (labId: number, data: any) => {
  const existingLab = await prisma.laboratories.findUnique({
    where: { lab_id: labId },
  });
  if (!existingLab) throw new Error("NOT_FOUND: Laboratory not found");

  if (data.lab_name && data.lab_name !== existingLab.lab_name) {
    const duplicateLab = await prisma.laboratories.findFirst({
      where: { lab_name: data.lab_name },
    });
    if (duplicateLab)
      throw new Error("DUPLICATE: Laboratory with this name already exists");
  }

  return prisma.laboratories.update({
    where: { lab_id: labId },
    data: {
      lab_name: data.lab_name || existingLab.lab_name,
      location:
        data.location !== undefined ? data.location : existingLab.location,
      dept_id:
        data.dept_id !== undefined
          ? data.dept_id
            ? Number(data.dept_id)
            : null
          : existingLab.dept_id,
    },
  });
};

export const deleteLaboratory = async (labId: number) => {
  const existingLab = await prisma.laboratories.findUnique({
    where: { lab_id: labId },
  });
  if (!existingLab) throw new Error("NOT_FOUND: Laboratory not found");

  const [assignedUsers, assetCount, reportCount] = await Promise.all([
    prisma.users.count({ where: { lab_id: labId } }),
    prisma.inventory_assets.count({ where: { lab_id: labId } }),
    prisma.daily_reports.count({ where: { lab_id: labId } }),
  ]);

  if (assignedUsers > 0)
    throw new Error(
      "VALIDATION: Cannot delete laboratory with assigned users. Please reassign users first.",
    );
  if (assetCount > 0)
    throw new Error(
      "VALIDATION: Cannot delete laboratory with inventory assets. Please move or delete assets first.",
    );
  if (reportCount > 0)
    throw new Error(
      "VALIDATION: Cannot delete laboratory with daily reports. Please delete reports first.",
    );

  await prisma.laboratories.delete({ where: { lab_id: labId } });
  return { message: "Laboratory deleted successfully" };
};

export const getLaboratoryDetails = async (identifier: string | number) => {
  const labId = parseInt(String(identifier));
  const isNumeric = !isNaN(labId);

  let laboratory = null;

  if (isNumeric) {
    laboratory = await prisma.laboratories.findUnique({
      where: { lab_id: labId },
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true, role: true },
        },
        departments: { select: { dept_id: true, dept_name: true } },
      },
    });
  } else {
    const decodedLabName = decodeURIComponent(String(identifier));
    laboratory = await prisma.laboratories.findFirst({
      where: { lab_name: decodedLabName },
      include: {
        users: {
          select: { user_id: true, full_name: true, email: true, role: true },
        },
        departments: { select: { dept_id: true, dept_name: true } },
      },
    });
  }

  if (!laboratory) throw new Error("NOT_FOUND: Laboratory not found");

  let inCharge = null;
  if (laboratory.in_charge_id) {
    inCharge = await prisma.users.findUnique({
      where: { user_id: laboratory.in_charge_id },
      select: { user_id: true, full_name: true, email: true, role: true },
    });
  }

  return { ...laboratory, in_charge: inCharge };
};
