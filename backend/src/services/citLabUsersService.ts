import { prisma } from "../config/database";
export const createCITLabUser = async (data: any, ipAddress: string | null) => {
  const validationErrors = [];
  if (!data.date) validationErrors.push("Date is required");
  if (!data.time_in) validationErrors.push("Time in is required");
  if (!data.time_out) validationErrors.push("Time out is required");
  if (!data.usage_type) validationErrors.push("Usage type is required");
  if (!data.faculty_student_name) validationErrors.push("Name is required");
  if (!data.user_type) validationErrors.push("User type is required");
  if (!data.laboratory) validationErrors.push("Laboratory is required");
  if (!data.purpose) validationErrors.push("Purpose is required");

  if (data.faculty_student_name && data.faculty_student_name.length > 100)
    validationErrors.push("Name must be less than 100 characters");
  if (data.purpose && data.purpose.length > 500)
    validationErrors.push("Purpose must be less than 500 characters");
  if (
    data.faculty_student_name &&
    !/^[a-zA-Z\s.-]+$/.test(data.faculty_student_name)
  )
    validationErrors.push("Name contains invalid characters");

  if (validationErrors.length > 0) {
    throw new Error(`VALIDATION: ${validationErrors.join(", ")}`);
  }

  return prisma.cit_lab_logs.create({
    data: {
      date: new Date(data.date),
      time_in: data.time_in,
      time_out: data.time_out,
      usage_type: data.usage_type,
      faculty_student_name: data.faculty_student_name,
      user_type: data.user_type,
      year_level: data.year_level || null,
      laboratory: data.laboratory,
      ws_number: data.ws_number,
      purpose: data.purpose,
      monitored_by: data.monitored_by,
      ip_address: ipAddress,
    },
  });
};

export const getCITLabUsersLogs = async (filters: any) => {
  let whereClause = "";
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.start_date || filters.end_date) {
    if (filters.start_date && filters.end_date) {
      whereClause += ` AND reservation_date BETWEEN ? AND ? `;
      params.push(filters.start_date, filters.end_date);
      paramIndex += 2;
    } else if (filters.start_date) {
      whereClause += ` AND reservation_date >= ? `;
      params.push(filters.start_date);
      paramIndex += 1;
    } else if (filters.end_date) {
      whereClause += ` AND reservation_date <= ? `;
      params.push(filters.end_date);
      paramIndex += 1;
    }
  }

  if (filters.laboratory && filters.laboratory !== "all") {
    whereClause += ` AND laboratory_display = ? `;
    params.push(filters.laboratory);
    paramIndex += 1;
  }

  if (filters.user_type && filters.user_type !== "all") {
    const userTypeValue =
      filters.user_type === "student" ? "Student" : "Faculty";
    whereClause += ` AND user_type_category = ? `;
    params.push(userTypeValue);
    paramIndex += 1;
  }

  if (filters.search) {
    whereClause += ` AND searchable_text LIKE ? `;
    params.push(`%${filters.search}%`);
    paramIndex += 1;
  }

  const limitClause = filters.limit ? ` LIMIT ? ` : "";
  const offsetClause = filters.offset ? ` OFFSET ? ` : "";
  if (filters.limit) params.push(parseInt(filters.limit as string));
  if (filters.offset) params.push(parseInt(filters.offset as string));

  const finalWhereClause = whereClause
    ? `WHERE ${whereClause.substring(5)}`
    : "";

  const query = `
    SELECT * FROM cit_lab_users_logs_view 
    ${finalWhereClause}
    ORDER BY created_at DESC 
    ${limitClause} ${offsetClause}
  `;
  const logs = (await prisma.$queryRawUnsafe(query, ...params)) as any[];

  const countQuery = `SELECT COUNT(*) as total FROM cit_lab_users_logs_view ${finalWhereClause}`;
  const countResult = (await prisma.$queryRawUnsafe(
    countQuery,
    ...params.slice(0, paramIndex - 1),
  )) as any[];
  const totalCount = Number(countResult[0]?.total) || 0;

  // Serialize BigInt
  const serializedLogs = logs.map((log) => {
    const serializedLog: any = {};
    for (const key in log)
      serializedLog[key] =
        typeof log[key] === "bigint" ? Number(log[key]) : log[key];
    return serializedLog;
  });

  return { logs: serializedLogs, total: totalCount };
};

export const getLabWorkstations = async (labIdString: string) => {
  const lab_id = parseInt(labIdString);
  if (!lab_id || isNaN(lab_id))
    throw new Error("VALIDATION: Valid lab ID is required");

  const workstations = await prisma.workstations.findMany({
    where: { lab_id, workstation_name: { not: { contains: "Server" } } },
    select: {
      workstation_id: true,
      workstation_name: true,
      status_id: true,
      workstation_remarks: true,
    },
    orderBy: { workstation_name: "asc" },
  });

  workstations.sort((a, b) => {
    const extractNumber = (name: string) => {
      const match = name.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    const numA = extractNumber(a.workstation_name);
    const numB = extractNumber(b.workstation_name);
    if (numA !== numB) return numA - numB;
    return a.workstation_name.localeCompare(b.workstation_name);
  });

  return workstations;
};

export const getCITLabUsersAnalytics = async (filters: any) => {
  let whereClause = "";
  const params: any[] = [];

  if (filters.start_date && filters.end_date) {
    whereClause += " AND reservation_date BETWEEN ? AND ? ";
    params.push(filters.start_date, filters.end_date);
  } else if (filters.start_date) {
    whereClause += " AND reservation_date >= ? ";
    params.push(filters.start_date);
  } else if (filters.end_date) {
    whereClause += " AND reservation_date <= ? ";
    params.push(filters.end_date);
  }

  if (filters.laboratory && filters.laboratory !== "all") {
    whereClause += " AND laboratory_display = ? ";
    params.push(filters.laboratory);
  }

  const finalWhereClause = whereClause
    ? `WHERE ${whereClause.substring(5)}`
    : "";

  let groupByField = "laboratory_display";
  switch (filters.group_by) {
    case "usage_type":
      groupByField = "usage_type_display";
      break;
    case "user_type":
      groupByField = "user_type_category";
      break;
    case "month":
      groupByField = "MONTHNAME(reservation_date), YEAR(reservation_date)";
      break;
    case "day_of_week":
      groupByField = "DAYOFWEEK(reservation_date)";
      break;
    case "time_of_day":
      groupByField = "HOUR(created_at)";
      break;
  }

  const analyticsQuery = `
    SELECT ${groupByField}, COUNT(*) as total_logs, COUNT(DISTINCT faculty_student_name) as unique_users,
           SUM(CASE WHEN usage_type = 'set-in-reservation' THEN 1 ELSE 0 END) as lab_usage_count, MAX(created_at) as last_activity
    FROM cit_lab_users_logs_view ${finalWhereClause} GROUP BY ${groupByField} ORDER BY total_logs DESC
  `;
  const analyticsData = (await prisma.$queryRawUnsafe(
    analyticsQuery,
    ...params,
  )) as any[];

  const statsQuery = `
    SELECT COUNT(*) as total_logs, COUNT(DISTINCT faculty_student_name) as unique_users,
           COUNT(DISTINCT laboratory_display) as unique_laboratories, SUM(CASE WHEN usage_type = 'set-in-reservation' THEN 1 ELSE 0 END) as total_lab_usage,
           COUNT(DISTINCT reservation_date) as active_days
    FROM cit_lab_users_logs_view ${finalWhereClause}
  `;
  const statsData = (await prisma.$queryRawUnsafe(
    statsQuery,
    ...params,
  )) as any[];
  const stats = statsData[0] || {};

  const serializedAnalyticsData = analyticsData.map((item) => {
    const serializedItem: any = {};
    for (const key in item)
      serializedItem[key] =
        typeof item[key] === "bigint" ? Number(item[key]) : item[key];
    return serializedItem;
  });

  return {
    analytics: serializedAnalyticsData,
    statistics: {
      total_logs: parseInt(stats.total_logs) || 0,
      unique_users: parseInt(stats.unique_users) || 0,
      unique_laboratories: parseInt(stats.unique_laboratories) || 0,
      total_lab_usage: parseInt(stats.total_lab_usage) || 0,
      active_days: parseInt(stats.active_days) || 0,
    },
  };
};

export const getRecentCITLabUsersLogs = async (limit: number) => {
  const query = `
    SELECT log_id, faculty_student_name, user_type_category, laboratory_display, laboratory_location,
           usage_type_display, purpose, reservation_date_formatted, created_at
    FROM cit_lab_users_logs_view WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
    ORDER BY created_at DESC LIMIT ?
  `;
  const logs = (await prisma.$queryRawUnsafe(query, limit)) as any[];

  return logs.map((log) => {
    const serializedLog: any = {};
    for (const key in log)
      serializedLog[key] =
        typeof log[key] === "bigint" ? Number(log[key]) : log[key];
    return serializedLog;
  });
};
