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

  // Relations
  procedures?: {
    procedure: { procedure_name: string; procedure_id: number };
    is_checked: boolean;
  }[];
}

// 1. GET ALL REPORTS (Filtered by Lab & Quarter)
export const getLabPMCReports = async (labId: number, quarter: string) => {
  const response = await api.get("/maintenance/pmc", {
    params: { lab_id: labId, quarter },
  });
  return response.data;
};

// 2. GET SINGLE REPORT (By Workstation & Quarter)
export const getPMCReport = async (workstationId: number, quarter: string) => {
  const response = await api.get("/maintenance/pmc/detail", {
    params: { workstation_id: workstationId, quarter },
  });
  return response.data;
};

// 3. CREATE REPORT
export const createPMCReport = async (data: any) => {
  const response = await api.post("/maintenance/pmc", data);
  return response.data;
};
