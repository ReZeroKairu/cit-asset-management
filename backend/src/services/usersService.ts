import { prisma } from "../config/database";
import * as bcrypt from "bcryptjs";

export const getUserProfile = async (userId: number) => {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      full_name: true,
      email: true,
      role: true,
      lab_id: true,
      created_at: true,
      laboratories: {
        select: { lab_id: true, lab_name: true, location: true },
      },
    },
  });

  if (!user) throw new Error("NOT_FOUND: User not found");

  return {
    id: user.user_id,
    name: user.full_name,
    email: user.email,
    role: user.role,
    lab_id: user.lab_id,
    lab_name: user.laboratories?.lab_name || null,
    laboratory: user.laboratories,
    created_at: user.created_at,
  };
};

export const getUserAssignedLab = async (userId: number) => {
  const user = await prisma.users.findUnique({ where: { user_id: userId } });
  if (!user) throw new Error("NOT_FOUND: User not found");

  let assignedLab = null;
  if (user.lab_id) {
    assignedLab = await prisma.laboratories.findUnique({
      where: { lab_id: user.lab_id },
      select: { lab_id: true, lab_name: true, location: true },
    });
  }

  return {
    assigned_lab: assignedLab,
    has_lab: !!assignedLab,
    lab_id: user.lab_id,
    laboratory: assignedLab,
  };
};

export const getAllUsersWithAssignments = async () => {
  const [users, laboratories] = await Promise.all([
    prisma.users.findMany({ orderBy: { full_name: "asc" } }),
    prisma.laboratories.findMany({
      select: { lab_id: true, lab_name: true, location: true },
    }),
  ]);

  return users.map((user) => {
    const assignedLab = laboratories.find((lab) => lab.lab_id === user.lab_id);
    return {
      ...user,
      assigned_lab: assignedLab || null,
      has_lab: !!assignedLab,
    };
  });
};

export const assignUserToLab = async (userId: number, labId: number | null) => {
  const user = await prisma.users.findUnique({ where: { user_id: userId } });
  if (!user) throw new Error("NOT_FOUND: User not found");

  if (labId === null) {
    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: { lab_id: null },
      include: {
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true },
        },
      },
    });
    return {
      ...updatedUser,
      assigned_lab: updatedUser.laboratories,
      has_lab: !!updatedUser.laboratories,
    };
  }

  const lab = await prisma.laboratories.findUnique({
    where: { lab_id: labId },
  });
  if (!lab) throw new Error("NOT_FOUND: Laboratory not found");

  const existingCustodian = await prisma.users.findFirst({
    where: { lab_id: labId, role: "Custodian" },
  });
  if (existingCustodian && existingCustodian.user_id !== userId) {
    throw new Error(
      "VALIDATION: This laboratory already has a custodian assigned. Only one custodian per laboratory is allowed.",
    );
  }

  const updatedUser = await prisma.users.update({
    where: { user_id: userId },
    data: { lab_id: labId },
    include: {
      laboratories: {
        select: { lab_id: true, lab_name: true, location: true },
      },
    },
  });
  return {
    ...updatedUser,
    assigned_lab: updatedUser.laboratories,
    has_lab: !!updatedUser.laboratories,
  };
};

export const updateUser = async (userId: number, data: any) => {
  const existingUser = await prisma.users.findUnique({
    where: { user_id: userId },
  });
  if (!existingUser) throw new Error("NOT_FOUND: User not found");

  if (data.email && data.email !== existingUser.email) {
    const duplicateUser = await prisma.users.findFirst({
      where: { email: data.email },
    });
    if (duplicateUser)
      throw new Error("DUPLICATE: User with this email already exists");
  }

  const updatedUser = await prisma.users.update({
    where: { user_id: userId },
    data: {
      full_name: data.full_name || existingUser.full_name,
      email: data.email || existingUser.email,
      role: data.role || existingUser.role,
    },
    include: {
      laboratories: {
        select: { lab_id: true, lab_name: true, location: true },
      },
    },
  });

  return {
    ...updatedUser,
    assigned_lab: updatedUser.laboratories,
    has_lab: !!updatedUser.laboratories,
  };
};

export const deleteUser = async (userId: number, requesterId: number) => {
  if (requesterId === userId)
    throw new Error("VALIDATION: Cannot delete your own account");

  const existingUser = await prisma.users.findUnique({
    where: { user_id: userId },
  });
  if (!existingUser) throw new Error("NOT_FOUND: User not found");

  await prisma.users.delete({ where: { user_id: userId } });
  return { message: "User deleted successfully" };
};

export const getOrganizationData = async () => {
  const [campuses, officeTypes, departments, laboratories] = await Promise.all([
    prisma.campuses.findMany(),
    prisma.office_types.findMany(),
    prisma.departments.findMany(),
    prisma.laboratories.findMany(),
  ]);
  return { campuses, officeTypes, departments, laboratories };
};

export const createUser = async (data: any) => {
  const { full_name, email, password, role, lab_id } = data;

  const existingUser = await prisma.users.findUnique({ where: { email } });
  if (existingUser) throw new Error("DUPLICATE: Email already exists");

  if (lab_id && (role === "Custodian" || !role)) {
    const existingCustodian = await prisma.users.findFirst({
      where: { lab_id: Number(lab_id), role: "Custodian" },
    });
    if (existingCustodian)
      throw new Error(
        "VALIDATION: This laboratory already has a custodian assigned.",
      );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.users.create({
      data: {
        full_name,
        email,
        password_hash: hashedPassword,
        role: role || "Custodian",
        lab_id: lab_id ? Number(lab_id) : null,
      },
      include: {
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true },
        },
      },
    });

    if (lab_id && (role === "Custodian" || !role)) {
      await tx.laboratories.update({
        where: { lab_id: Number(lab_id) },
        data: { in_charge_id: newUser.user_id },
      });
    }
    return newUser;
  });

  const { password_hash, ...userWithoutPassword } = result;
  return {
    ...userWithoutPassword,
    assigned_lab: result.laboratories || null,
    has_lab: !!result.laboratories,
    message:
      role === "Custodian" || !role
        ? "Custodian created and assigned as laboratory manager successfully"
        : "User created successfully",
  };
};
