import { prisma } from "../config/database";

export const getLifecycleTimeline = async (labId?: number) => {
  let query = `SELECT * FROM asset_lifecycle_timeline_view`;
  const params: any[] = [];
  if (labId) {
    query += " WHERE lab_id = ?";
    params.push(Number(labId));
  }
  query += " ORDER BY current_age_years DESC, lab_name, workstation_name";
  return prisma.$queryRawUnsafe(query, ...params);
};

export const getLifecycleSummary = async (labId?: number) => {
  let query = `
    SELECT lifecycle_stage, lifecycle_status, COUNT(*) AS asset_count,
    COUNT(DISTINCT lab_id) AS lab_count, COUNT(DISTINCT workstation_id) AS workstation_count,
    AVG(current_age_years) AS avg_age_years,
    COUNT(CASE WHEN assignment_status = 'Assigned' THEN 1 END) AS assigned_count,
    COUNT(CASE WHEN assignment_status = 'Unassigned' THEN 1 END) AS unassigned_count
    FROM asset_lifecycle_timeline_view
  `;
  const params: any[] = [];
  if (labId) {
    query += " WHERE lab_id = ?";
    params.push(Number(labId));
  }
  query +=
    " GROUP BY lifecycle_stage, lifecycle_status ORDER BY lifecycle_stage";
  return prisma.$queryRawUnsafe(query, ...params);
};

export const getUnits = async (deviceTypeId?: number) => {
  const where = deviceTypeId ? { device_type_id: Number(deviceTypeId) } : {};
  return prisma.units.findMany({ where });
};

export const createUnit = async (unitName: string, deviceTypeId: number) => {
  const existingUnit = await prisma.units.findFirst({
    where: { unit_name: unitName.trim(), device_type_id: deviceTypeId },
  });
  if (existingUnit)
    throw new Error(
      "VALIDATION: Unit with this name already exists for this device type",
    );

  return prisma.units.create({
    data: { unit_name: unitName.trim(), device_type_id: deviceTypeId },
  });
};

export const getDeviceTypes = async () => prisma.device_types.findMany();

export const resolveWorkstation = async (
  labId: number,
  workstationName: string,
) => {
  const workstation = await prisma.workstations.findFirst({
    where: {
      workstation_name: String(workstationName).trim(),
      lab_id: Number(labId),
    },
    select: { workstation_id: true },
  });
  if (!workstation) throw new Error("NOT_FOUND: Workstation not found");
  return { workstation_id: workstation.workstation_id };
};
