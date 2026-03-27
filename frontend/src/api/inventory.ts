// frontend/src/api/inventory.ts
import api from "./axios";

export interface Asset {
  asset_id: number;
  lab_id: number | null;
  workstation_id: number | null;
  unit_id: number | null;
  added_by_user_id: number | null;
  date_added: string;
  asset_details?: {
    detail_id: number;
    property_tag_no: string | null;
    serial_number: string | null;
    description: string | null;
    date_of_purchase: string | null;
    date_disposed: string | null;
    disposed_by: string | null;
    asset_remarks?: string | null;
    status_id: number;
    asset_statuses?: {
      status_name: string;
    };
  };
  laboratories?: {
    lab_name: string;
  };
  workstations?: {
    workstation_name: string;
  };
  units?: {
    unit_name: string;
  };
  users?: {
    full_name: string;
  };
}

// Get all inventory assets
export const getInventory = async (params?: {
  workstation_id?: number;
  lab_id?: number;
  status_id?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.workstation_id)
    queryParams.append("workstation_id", params.workstation_id.toString());
  if (params?.lab_id) queryParams.append("lab_id", params.lab_id.toString());
  if (params?.status_id) queryParams.append("status_id", params.status_id.toString());

  const response = await api.get(`/inventory?${queryParams}`);
  return response.data;
};

// Create new asset
export const createAsset = async (data: any) => {
  const response = await api.post("/inventory", data);
  return response.data;
};

// Batch create assets
export const batchCreateAssets = async (assets: any[]) => {
  const response = await api.post("/inventory/batch", { assets });
  return response.data;
};

// Update asset
export const updateAsset = async (id: number, data: any) => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const fullUrl = `${baseURL}/inventory/${id}`;
  const timestamp = new Date().getTime();
  
  console.log('🔍 API Call - Full URL:', fullUrl);
  console.log('🔍 API Call - Data:', data);
  console.log('🔍 API Call - Timestamp:', timestamp);
  
  // Add timestamp to bypass caching
  const response = await api.put(`/inventory/${id}?t=${timestamp}`, data);
  console.log('🔍 API Response:', response.data);
  console.log('🔍 API Response Status:', response.status);
  return response.data;
};

// Delete asset
export const deleteAsset = async (id: number) => {
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
};

// Get units (e.g. Monitor, CPU, Keyboard)
export const getUnits = async (deviceTypeId?: number) => {
  const query = deviceTypeId ? `?device_type_id=${deviceTypeId}` : "";
  const response = await api.get(`/inventory/units${query}`);
  return response.data;
};

// Create new unit
export const createUnit = async (data: { unit_name: string; device_type_id: number }) => {
  const response = await api.post("/inventory/units", data);
  return response.data;
};

// Get device types (e.g. PC Devices, Network Devices)
export const getDeviceTypes = async () => {
  const response = await api.get("/inventory/device-types");
  return response.data;
};

// Asset Lifecycle Timeline View API
export interface AssetLifecycleTimeline {
  asset_id: number;
  property_tag_no: string;
  serial_number: string;
  description: string;
  quantity: number;
  asset_remarks: string;
  current_age_years: number;
  current_age_months: number;
  current_age_days: number;
  timeline_position: number;
  lifecycle_stage: string;
  lifecycle_status: string;
  status_name: string;
  status_id: number;
  unit_name: string;
  unit_id: number;
  device_type_name: string;
  device_type_id: number;
  workstation_name: string;
  workstation_id: number | null;
  lab_name: string;
  lab_id: number | null;
  lab_location: string;
  asset_name: string;
  date_of_purchase: string | null;
  formatted_purchase_date: string;
  date_added: string;
  formatted_added_date: string;
  added_by_name: string;
  added_by_email: string;
  current_date: string;
  assignment_status: string;
  age_category: string;
  searchable_text: string;
}

// Get asset lifecycle timeline data
export const getAssetLifecycleTimeline = async (labId?: number) => {
  const query = labId ? `?lab_id=${labId}` : "";
  const response = await api.get(`/inventory/lifecycle-timeline${query}`);
  return response.data as AssetLifecycleTimeline[];
};

// Get asset lifecycle summary
export interface AssetLifecycleSummary {
  lifecycle_stage: string;
  lifecycle_status: string;
  asset_count: number;
  lab_count: number;
  workstation_count: number;
  avg_age_years: number;
  assigned_count: number;
  unassigned_count: number;
}

export const getAssetLifecycleSummary = async (labId?: number) => {
  const query = labId ? `?lab_id=${labId}` : "";
  const response = await api.get(`/inventory/lifecycle-summary${query}`);
  return response.data as AssetLifecycleSummary[];
};

// ✅ UPDATED FUNCTION: Correctly maps the current remarks
export const getWorkstationAssets = async (workstationId: number) => {
  const data = await getInventory({ workstation_id: workstationId });

  return data.map((asset: Asset) => ({
    asset_id: asset.asset_id,
    unit_name: asset.units?.unit_name || "Unknown",
    property_tag_no: asset.asset_details?.property_tag_no || "N/A",
    serial_number: asset.asset_details?.serial_number || "N/A",

    // ✅ FIX: Map from asset_details (not details)
    asset_remarks: asset.asset_details?.asset_remarks || "",

    // ✅ FIX: Map from asset_details.asset_statuses (not details.current_status)
    status: asset.asset_details?.asset_statuses?.status_name || "Unknown",
    status_id: asset.asset_details?.status_id || 1,
  }));
};

export const getAssetStatuses = async () => {
  const response = await api.get("/inventory/statuses");
  return response.data;
};
