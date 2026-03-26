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

export interface DisposalWithDetails {
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
  property_tag_no?: string | null;
  asset_description?: string | null;
  serial_number?: string | null;
  date_of_purchase?: string | null;
  quantity?: number | null;
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
