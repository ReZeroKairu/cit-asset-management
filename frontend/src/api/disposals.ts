import api from "./axios";

export interface DisposalData {
  asset_id: number;
  disposal_date: string;
  disposal_reason: string;
  disposal_method: "Sold" | "Scrap" | "Donated" | "Lost" | "Stolen";
  disposal_value?: number | null;
  approved_by?: number | null;
  disposed_by?: number | null;
  disposal_document?: string | null;
  disposal_remarks?: string | null;
}

export interface DisposalFilters {
  disposal_method?: string;
  date_from?: string;
  date_to?: string;
  workstation_name?: string;
  lab_name?: string;
}

export interface Disposal {
  disposal_id: number;
  asset_id: number;
  workstation_id?: number | null;
  workstation_name: string;
  lab_id?: number | null;
  lab_name?: string | null;
  disposal_date: string;
  disposal_reason: string;
  disposal_method: string;
  disposal_value?: number | null;
  approved_by?: number | null;
  disposed_by?: number | null;
  disposal_document?: string | null;
  disposal_remarks?: string | null;
  created_at: string;
  asset: {
    asset_id: number;
    asset_details?: {
      property_tag_no?: string | null;
      description?: string | null;
      serial_number?: string | null;
      date_of_purchase?: string | null;
    } | null;
  } | null;
  approver?: {
    user_id: number;
    full_name: string;
  } | null;
  disposer?: {
    user_id: number;
    full_name: string;
  } | null;
}

export interface AssetForDisposal {
  asset_id: number;
  lab_id?: number | null;
  workstation_id?: number | null;
  unit_id?: number | null;
  added_by_user_id?: number | null;
  date_added?: string | null;
  asset_details?: {
    property_tag_no?: string | null;
    description?: string | null;
    serial_number?: string | null;
    date_of_purchase?: string | null;
  } | null;
  workstations?: {
    workstation_name: string;
  } | null;
  laboratories?: {
    lab_name: string;
  } | null;
  units?: {
    unit_name: string;
  } | null;
}

export interface DisposalStatistics {
  totalDisposals: number;
  disposalsByMethod: Array<{
    disposal_method: string;
    _count: { disposal_method: number };
  }>;
  disposalsByMonth: Array<{
    month: string;
    count: number;
  }>;
  totalValue: number;
}

// 1. CREATE Disposal Record
export const createDisposal = async (disposalData: DisposalData): Promise<Disposal> => {
  const response = await api.post("/api/disposals", disposalData);
  return response.data.data;
};

// 2. GET All Disposals (with filtering)
export const getAllDisposals = async (filters?: DisposalFilters): Promise<{
  message: string;
  data: Disposal[];
  count: number;
}> => {
  const params = new URLSearchParams();
  
  if (filters?.disposal_method) params.append("disposal_method", filters.disposal_method);
  if (filters?.date_from) params.append("date_from", filters.date_from);
  if (filters?.date_to) params.append("date_to", filters.date_to);
  if (filters?.workstation_name) params.append("workstation_name", filters.workstation_name);
  if (filters?.lab_name) params.append("lab_name", filters.lab_name);

  const response = await api.get(`/api/disposals?${params.toString()}`);
  return response.data;
};

// 3. GET Single Disposal
export const getDisposalById = async (disposalId: number): Promise<{
  message: string;
  data: Disposal;
}> => {
  const response = await api.get(`/api/disposals/${disposalId}`);
  return response.data;
};

// 4. UPDATE Disposal
export const updateDisposal = async (disposalId: number, updateData: Partial<DisposalData>): Promise<{
  message: string;
  data: Disposal;
}> => {
  const response = await api.put(`/api/disposals/${disposalId}`, updateData);
  return response.data;
};

// 5. DELETE Disposal
export const deleteDisposal = async (disposalId: number, restoreAsset: boolean = false): Promise<{
  message: string;
  restored: boolean;
}> => {
  const response = await api.delete(`/api/disposals/${disposalId}?restore=${restoreAsset}`);
  return response.data;
};

// 6. GET Disposal Statistics
export const getDisposalStatistics = async (): Promise<{
  message: string;
  data: DisposalStatistics;
}> => {
  const response = await api.get("/api/disposals/statistics/overview");
  return response.data;
};

// 7. GET Assets Available for Disposal
export const getAvailableAssetsForDisposal = async (): Promise<{
  message: string;
  data: AssetForDisposal[];
  count: number;
}> => {
  const response = await api.get("/api/disposals/assets/available");
  return response.data;
};
