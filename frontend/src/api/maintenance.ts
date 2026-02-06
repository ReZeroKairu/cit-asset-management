// frontend/src/api/maintenance.ts
import api from "./axios";

export interface MaintenanceReport {
  report_id: number;
  lab_id: number;
  report_date: string;
  general_remarks: string;
  lab_name?: string;
  user_name?: string;
  procedures?: any[];
  // ✅ UPDATED: Add remarks and status here
  workstation_items?: {
    workstation_id: number;
    remarks?: string;
    status?: string;
  }[];
}

// Get all maintenance reports
export const getAllMaintenanceReports = async () => {
  const response = await api.get("/maintenance-reports");
  return response.data;
};

// Get a single report details
export const getMaintenanceReportById = async (id: number) => {
  const response = await api.get(`/maintenance-reports/${id}`);
  return response.data;
};

// Create a new report
export const createMaintenanceReport = async (data: any) => {
  const response = await api.post("/maintenance-reports", data);
  return response.data;
};

// Update an existing report
export const updateMaintenanceReport = async (id: number, data: any) => {
  const response = await api.put(`/maintenance-reports/${id}`, data);
  return response.data;
};

// Delete a report
export const deleteMaintenanceReport = async (id: number) => {
  const response = await api.delete(`/maintenance-reports/${id}`);
  return response.data;
};
