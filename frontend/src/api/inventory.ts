// frontend/src/api/inventory.ts
import api from "./axios";

export interface Asset {
  asset_id: number;
  lab_id: number | null;
  workstation_id: number | null;
  unit_id: number | null;
  added_by_user_id: number | null;
  date_added: string;
  details?: {
    detail_id: number;
    property_tag_no: string | null;
    serial_number: string | null;
    description: string | null;
    asset_remarks?: string | null;
    status_id: number;
    current_status?: {
      status_name: string;
    };
  };
  laboratories?: {
    lab_name: string;
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
}) => {
  const queryParams = new URLSearchParams();
  if (params?.workstation_id)
    queryParams.append("workstation_id", params.workstation_id.toString());
  if (params?.lab_id) queryParams.append("lab_id", params.lab_id.toString());

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
  const response = await api.put(`/inventory/${id}`, data);
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

// Get device types (e.g. PC Devices, Network Devices)
export const getDeviceTypes = async () => {
  const response = await api.get("/inventory/device-types");
  return response.data;
};

// ✅ UPDATED FUNCTION: Correctly maps the current remarks
export const getWorkstationAssets = async (workstationId: number) => {
  const data = await getInventory({ workstation_id: workstationId });

  return data.map((asset: Asset) => ({
    asset_id: asset.asset_id,
    unit_name: asset.units?.unit_name || "Unknown",
    property_tag_no: asset.details?.property_tag_no || "N/A",
    serial_number: asset.details?.serial_number || "N/A",

    // ✅ FIX: Explicitly map the current remarks from the DB
    // (Previously this might have been mapped to description)
    asset_remarks: asset.details?.asset_remarks || "",

    status: asset.details?.current_status?.status_name || "Unknown",
    status_id: asset.details?.status_id || 1,
  }));
};

export const getAssetStatuses = async () => {
  const response = await api.get("/inventory/statuses");
  return response.data;
};
