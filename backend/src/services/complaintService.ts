import { prisma } from "../config/database";
// Helper to check for conflicts
const checkExistingComplaint = async (
  asset_id?: number,
  workstation_id?: number,
  lab_id?: number,
) => {
  if (asset_id) {
    return prisma.complaints.findFirst({
      where: { asset_id, status: { in: ["Open", "In_Progress"] } },
    });
  } else if (workstation_id) {
    return prisma.complaints.findFirst({
      where: {
        workstation_id,
        asset_id: null,
        status: { in: ["Open", "In_Progress"] },
      },
    });
  } else if (lab_id) {
    return prisma.complaints.findFirst({
      where: {
        lab_id,
        workstation_id: null,
        asset_id: null,
        status: { in: ["Open", "In_Progress"] },
      },
    });
  }
  return null;
};

export const createComplaint = async (data: any, ipAddress: string | null) => {
  const {
    lab_id,
    workstation_id,
    asset_id,
    faculty_student_name,
    user_type,
    year_level,
    issue_description,
    asset_info,
  } = data;

  const laboratory = await prisma.laboratories.findUnique({
    where: { lab_id: Number(lab_id) },
    include: { users: { where: { role: "Custodian" }, take: 1 } },
  });

  if (!laboratory) throw new Error("VALIDATION: Invalid laboratory");

  const existingComplaint = await checkExistingComplaint(
    asset_id ? Number(asset_id) : undefined,
    workstation_id ? Number(workstation_id) : undefined,
    Number(lab_id),
  );

  if (existingComplaint) {
    const conflictMessage = asset_id
      ? "A complaint is already pending for this asset"
      : existingComplaint.workstation_id
        ? "A complaint is already pending for this workstation"
        : "A complaint is already pending for this laboratory";
    const error: any = new Error(`CONFLICT: ${conflictMessage}`);
    error.existingId = existingComplaint.complaint_id;
    throw error;
  }

  return prisma.complaints.create({
    data: {
      lab_id: Number(lab_id),
      workstation_id: workstation_id ? Number(workstation_id) : null,
      asset_id: asset_id ? Number(asset_id) : null,
      faculty_student_name,
      user_type,
      year_level: user_type === "Faculty" ? null : year_level || null,
      issue_description,
      asset_info: asset_info || null,
      ip_address: ipAddress,
      status: "Open",
      monitored_by: laboratory.users[0]?.full_name || null,
      approved_by: laboratory.users[0]?.full_name || null,
      custodian_user_id: laboratory.users[0]?.user_id || null,
      updated_at: new Date(),
    } as any,
    include: { laboratories: true, workstations: true },
  });
};

export const getLaboratoriesWithCustodian = async (
  userRole?: string,
  userLabId?: number,
) => {
  let whereClause = {};
  if (userRole === "Custodian") whereClause = { lab_id: userLabId || -1 };

  const laboratories = await prisma.laboratories.findMany({
    where: whereClause,
    include: { users: { where: { role: "Custodian" }, take: 1 } },
    orderBy: { lab_name: "asc" },
  });

  return laboratories.map((lab) => ({
    lab_id: lab.lab_id,
    lab_name: lab.lab_name,
    location: lab.location,
    custodian_user_id: lab.users[0]?.user_id || null,
    custodian: lab.users[0] || null,
  }));
};

export const getWorkstationsByLab = async (
  labId: number,
  userRole?: string,
  userLabId?: number,
) => {
  if (userRole === "Custodian" && userLabId !== labId) {
    throw new Error(
      "FORBIDDEN: You can only view workstations from your assigned laboratory",
    );
  }

  const workstations = await prisma.workstations.findMany({
    where: { lab_id: labId, workstation_name: { not: { contains: "Server" } } },
    include: { laboratories: true, asset_statuses: true },
  });

  return workstations.sort((a, b) => {
    const numA = parseInt(a.workstation_name.match(/(\d+)/)?.[1] || "0");
    const numB = parseInt(b.workstation_name.match(/(\d+)/)?.[1] || "0");
    return numA !== numB
      ? numA - numB
      : a.workstation_name.localeCompare(b.workstation_name);
  });
};

export const getAssetsByWorkstation = async (workstationId: number) => {
  return prisma.inventory_assets.findMany({
    where: { workstation_id: workstationId },
    include: {
      units: { select: { unit_name: true } },
      asset_details: {
        include: { asset_statuses: { select: { status_name: true } } },
      },
    },
    orderBy: { asset_id: "asc" },
  });
};

export const getAllComplaints = async (userRole?: string, userId?: number) => {
  let whereConditions: string[] = [];
  const params: any[] = [];

  if (userRole === "Custodian") {
    if (!userId) return [];
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { lab_id: true },
    });
    if (!user?.lab_id) return [];
    whereConditions.push("lab_id = ?");
    params.push(user.lab_id);
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  try {
    const complaints = await prisma.$queryRawUnsafe(
      `
      SELECT complaint_id, lab_id, workstation_id, asset_id, faculty_student_name, user_type, year_level,
      issue_description, asset_info, complaint_status as status, monitored_by, approved_by, custodian_user_id,
      remarks, resolved_at, created_at, updated_at, accepted_at, lab_name, workstation_name, asset_property_tag, custodian_name
      FROM view_complaint_details ${whereClause} ORDER BY created_at DESC
    `,
      ...params,
    );

    return (complaints as any[]).map((c) => ({
      ...c,
      complaint_id: Number(c.complaint_id),
      lab_id: Number(c.lab_id),
      workstation_id: Number(c.workstation_id),
      asset_id: Number(c.asset_id),
      custodian_user_id: Number(c.custodian_user_id),
      laboratories: c.lab_name
        ? { lab_id: Number(c.lab_id), lab_name: c.lab_name, location: null }
        : null,
      workstations: c.workstation_name
        ? {
            workstation_id: Number(c.workstation_id),
            workstation_name: c.workstation_name,
          }
        : null,
      users: c.custodian_name
        ? {
            user_id: Number(c.custodian_user_id),
            full_name: c.custodian_name,
            email: null,
          }
        : null,
    }));
  } catch (error) {
    // Fallback to Prisma
    const prismaWhere: any = {};
    if (userRole === "Custodian") {
      const user = await prisma.users.findUnique({
        where: { user_id: Number(userId) },
        select: { lab_id: true },
      });
      prismaWhere.lab_id = user?.lab_id || -1;
    }
    return prisma.complaints.findMany({
      where: prismaWhere,
      include: {
        laboratories: {
          select: { lab_id: true, lab_name: true, location: true },
        },
        workstations: {
          select: { workstation_id: true, workstation_name: true },
        },
        users: { select: { user_id: true, full_name: true, email: true } },
      },
      orderBy: { created_at: "desc" },
    });
  }
};

export const getComplaintById = async (
  complaintId: number,
  userRole?: string,
  userLabId?: number,
) => {
  const complaint = await prisma.complaints.findUnique({
    where: { complaint_id: complaintId },
    include: { laboratories: true, workstations: true, users: true },
  });

  if (!complaint) throw new Error("NOT_FOUND: Complaint not found");
  if (userRole === "Custodian" && complaint.lab_id !== userLabId)
    throw new Error(
      "FORBIDDEN: You can only view complaints from your assigned laboratory",
    );

  return complaint;
};

export const updateComplaintStatus = async (
  complaintId: number,
  status: string,
) => {
  if (!status) throw new Error("VALIDATION: Status is required");
  return prisma.complaints.update({
    where: { complaint_id: complaintId },
    data: { status: status as any, updated_at: new Date() },
    include: { laboratories: true, workstations: true },
  });
};

export const updateComplaintRemarks = async (
  complaintId: number,
  remarks: string,
) => {
  return prisma.complaints.update({
    where: { complaint_id: complaintId },
    data: { remarks: remarks || null, updated_at: new Date() },
    include: { laboratories: true, workstations: true },
  });
};

export const getComplaintsAnalytics = async (
  userRole?: string,
  userId?: number,
  startDate?: string,
  endDate?: string,
) => {
  let whereClause: any = {};

  if (userRole === "Custodian") {
    const user = await prisma.users.findUnique({
      where: { user_id: Number(userId) },
      select: { lab_id: true },
    });
    whereClause = { lab_id: user?.lab_id || -1 };
  }

  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) whereClause.created_at.gte = new Date(startDate);
    if (endDate) whereClause.created_at.lte = new Date(endDate);
  }

  const [
    totalComplaints,
    totalResolvedComplaints,
    labComplaints,
    labResolvedComplaints,
  ] = await Promise.all([
    prisma.complaints.count({ where: whereClause }),
    prisma.complaints.count({ where: { ...whereClause, status: "Resolved" } }),
    prisma.complaints.groupBy({
      by: ["lab_id"],
      where: whereClause,
      _count: { complaint_id: true },
    }),
    prisma.complaints.groupBy({
      by: ["lab_id"],
      where: { ...whereClause, status: "Resolved" },
      _count: { complaint_id: true },
    }),
  ]);

  const labIds = [
    ...new Set([
      ...labComplaints.map((lc) => lc.lab_id),
      ...labResolvedComplaints.map((lc) => lc.lab_id),
    ]),
  ];
  const labs = await prisma.laboratories.findMany({
    where: { lab_id: { in: labIds } },
    select: { lab_id: true, lab_name: true },
  });

  const labNameMap = labs.reduce(
    (acc, lab) => ({ ...acc, [lab.lab_id]: lab.lab_name }),
    {} as Record<number, string>,
  );
  const resolvedLookup = labResolvedComplaints.reduce(
    (acc, lc) => ({ ...acc, [lc.lab_id]: lc._count.complaint_id }),
    {} as Record<number, number>,
  );

  const labComplaintsData = labIds.map((labId) => {
    const total =
      labComplaints.find((lc) => lc.lab_id === labId)?._count.complaint_id || 0;
    const resolved = resolvedLookup[labId] || 0;
    return {
      lab_name: labNameMap[labId] || "Unknown Lab",
      total_count: total,
      resolved_count: resolved,
      active_count: Math.max(0, total - resolved),
    };
  });

  return {
    totalComplaints,
    totalResolvedComplaints,
    labComplaints: labComplaintsData,
  };
};

export const checkAssetComplaints = async (
  assetId: number,
  userRole?: string,
  userLabId?: number,
) => {
  const asset = await prisma.inventory_assets.findUnique({
    where: { asset_id: assetId },
    select: { lab_id: true },
  });
  if (!asset) throw new Error("NOT_FOUND: Asset not found");

  if (userRole === "Custodian" && asset.lab_id !== userLabId) {
    throw new Error(
      "FORBIDDEN: You can only check assets from your assigned laboratory",
    );
  }

  const existingComplaint = await prisma.complaints.findFirst({
    where: { asset_id: assetId, status: { in: ["Open", "In_Progress"] } },
    select: { complaint_id: true, status: true, created_at: true },
    orderBy: { created_at: "desc" },
  });

  return existingComplaint
    ? {
        hasExistingComplaint: true,
        existingComplaintId: existingComplaint.complaint_id,
        status: existingComplaint.status,
      }
    : { hasExistingComplaint: false };
};
