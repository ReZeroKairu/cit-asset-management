//frontend/src/api/workstations.ts
import api from "./axios";

export interface Workstation {
  workstation_id: number;
  workstation_name: string;
  lab_id: number | null;
  laboratories?: {
    lab_id: number;
    lab_name: string;
    location: string;
  } | null;
  asset_statuses?: {
    status_id: number;
    status_name: string;
  } | null;
  inventory_assets?: any[];
  created_at: string;
}

// Get all workstations
export const getAllWorkstations = async () => {
  const response = await api.get("/workstations");
  return response.data;
};

// Create new workstation
export const createWorkstation = async (data: {
  workstation_name: string;
  lab_id: number;
}) => {
  const response = await api.post("/workstations", data);
  return response.data;
};

// Get workstation details
export const getWorkstationDetails = async (name: string) => {
  const response = await api.get(`/workstations/${name}`);
  return response.data;
};
