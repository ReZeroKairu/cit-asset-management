//frontend/src/api/procedures.ts
import api from "./axios";

export interface Procedure {
  procedure_id: number;
  procedure_name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at?: string;
  procedure_checklists?: ProcedureChecklist[];
}

export interface ProcedureChecklist {
  checklist_id: number;
  procedure_id: number;
  checklist_name: string;
  description?: string;
  order_sequence: number;
  is_required: boolean;
  status?: string;
  remarks?: string;
  response_id?: number;
}

export interface ReportProcedure {
  procedure_id: number;
  procedure_name: string;
  description?: string;
  category?: string;
  overall_status?: string;
  overall_remarks?: string;
  checklists: ProcedureChecklist[];
}

// Get all procedures with their checklists
export const getAllProcedures = async () => {
  const response = await api.get("/daily-reports/utils/all-procedures");
  return response.data;
};

// Get procedures for a specific daily report
export const getReportProcedures = async (reportId: number) => {
  const response = await api.get(`/daily-reports/${reportId}/procedures`);
  return response.data;
};

// Save procedures for a daily report
export const saveReportProcedures = async (
  reportId: number,
  procedures: {
    procedure_id: number;
    overall_status?: string;
    overall_remarks?: string;
    checklists?: {
      checklist_id: number;
      status?: string;
      remarks?: string;
    }[];
  }[],
) => {
  const response = await api.post(`/daily-reports/${reportId}/procedures`, {
    reportId,
    procedures,
  });
  return response.data;
};

// Get procedures applicable to workstations
export const getWorkstationProcedures = async () => {
  const response = await api.get("/daily-reports/utils/workstation-procedures");
  return response.data;
};
