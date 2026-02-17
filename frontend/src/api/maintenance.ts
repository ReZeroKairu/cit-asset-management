import api from "./axios";

// ✅ NEW INTERFACE: Matches your new Prisma Schema
export interface PMCReport {
  pmc_id: number;
  report_date: string;
  quarter: string;
  lab_id: number;
  user_id: number;
  workstation_id: number;

  // Status & Remarks
  workstation_status: string;
  overall_remarks: string;

  // Network & Software Columns
  software_name?: string;
  software_status?: string;
  connectivity_type?: string;
  connectivity_type_status?: string;
  connectivity_speed?: string;
  connectivity_speed_status?: string;

  // Service tracking fields
  service_count?: number;
  updated_at?: string;

  // Relations
  procedures?: {
    procedure: { procedure_name: string; procedure_id: number };
    is_checked: boolean;
  }[];
  service_logs?: ServiceLog[];
}

export interface ServiceLog {
  log_id: number;
  pmc_id: number;
  service_type: string;
  service_date: string;
  performed_by: number;
  remarks?: string;
  workstation_status_before?: string;
  workstation_status_after?: string;
  created_at: string;
  user?: {
    user_id: number;
    full_name: string;
  };
  asset_actions?: ServiceLogAsset[];
  log_procedures?: ServiceLogProcedure[];
}

export interface ServiceLogAsset {
  id: number;
  log_id: number;
  asset_id: number;
  action: string;
  status_before?: string;
  status_after?: string;
  remarks?: string;
  old_property_tag?: string;
  new_property_tag?: string;
  replacement_asset_id?: number;
  asset?: {
    asset_id: number;
    units?: {
      unit_name: string;
    };
    details?: {
      property_tag_no?: string;
    };
  };
}

export interface ServiceLogProcedure {
  id: number;
  log_id: number;
  procedure_id: number;
  is_checked: boolean;
  remarks?: string;
  procedure?: {
    procedure_id: number;
    procedure_name: string;
  };
}

// 1. GET ALL REPORTS (Filtered by Lab & Quarter)
export const getLabPMCReports = async (labId: number, quarter: string) => {
  const response = await api.get("/maintenance/pmc", {
    params: { lab_id: labId, quarter },
  });
  return response.data;
};

// 2. GET SINGLE REPORT (By Workstation & Quarter)
export const getPMCReport = async (
  workstationId: number,
  quarter: string,
): Promise<PMCReport> => {
  const response = await api.get("/maintenance/pmc/detail", {
    params: { workstation_id: workstationId, quarter },
  });
  return response.data;
};

// 3. CREATE REPORT
export const createPMCReport = async (
  data: Record<string, unknown>,
): Promise<PMCReport> => {
  const response = await api.post("/maintenance/pmc", data);
  return response.data;
};

// 4. GET SERVICE HISTORY
export const getServiceHistory = async (
  workstationId: number,
  quarter?: string,
): Promise<ServiceLog[]> => {
  const params: Record<string, string | number> = {
    workstation_id: workstationId,
  };
  if (quarter) params.quarter = quarter;
  const response = await api.get("/maintenance/pmc/history", { params });
  return response.data;
};

// 5. CREATE REPAIR LOG
export const createRepairLog = async (
  data: Record<string, unknown>,
): Promise<ServiceLog> => {
  const response = await api.post("/maintenance/pmc/repair", data);
  return response.data;
};
