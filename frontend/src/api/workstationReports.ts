// frontend/src/api/workstationReports.ts
import api from "./axios";

export interface WorkstationChecklist {
  item_id?: number;
  report_id?: number;
  workstation_id: number;
  workstation_name: string;
  status: "Working" | "Not Working" | "Under Maintenance";
  remarks?: string | null;
  checked?: boolean;
}

// Get workstations for a specific lab to populate the daily report form
export const getLabWorkstationsForReport = async (
  labId: number,
  reportId?: number,
) => {
  const params = new URLSearchParams();
  params.append("lab_id", labId.toString());
  if (reportId) params.append("reportId", reportId.toString());

  // Matches backend route: /daily-reports/utils/lab-workstations
  const response = await api.get(
    `/daily-reports/utils/lab-workstations?${params}`,
  );
  return response.data;
};

// Get existing checklist items for a specific report
export const getWorkstationChecklist = async (reportId: number) => {
  const response = await api.get(`/daily-reports/${reportId}/workstations`);
  return response.data;
};

// Save workstation checklist items
export const saveWorkstationChecklist = async (
  reportId: number,
  workstations: {
    workstation_id: number;
    status: string;
    remarks?: string | null;
  }[],
) => {
  const response = await api.post(`/daily-reports/${reportId}/workstations`, {
    reportId,
    workstations,
  });
  return response.data;
};
