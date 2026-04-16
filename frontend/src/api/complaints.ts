// Dynamic API URL detection
export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3001";
  }
  return `http://${hostname}:3001`;
};

const API_BASE_URL = getApiBaseUrl();
import api from "./axios";
console.log("🌐 API_BASE_URL initialized to:", API_BASE_URL);

export interface ComplaintData {
  lab_id: number;
  laboratory_name?: string;
  workstation_id?: number;
  workstation_name?: string;
  faculty_student_name: string;
  user_type: string;
  year_level?: string;
  issue_description: string;
  selected_asset?: any; // Store selected asset info
}

export interface Complaint {
  complaint_id: number;
  lab_id: number;
  workstation_id?: number;
  faculty_student_name: string;
  user_type: string;
  year_level?: string;
  issue_description: string;
  asset_info?: string;
  status: string;
  monitored_by?: string;
  approved_by?: string;
  custodian_user_id?: number;
  remarks?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  laboratories?: {
    lab_id: number;
    lab_name: string;
    location?: string;
  };
  workstations?: {
    workstation_id: number;
    workstation_name: string;
  };
  custodian?: {
    user_id: number;
    full_name: string;
    email: string;
  };
}

export interface Laboratory {
  lab_id: number;
  lab_name: string;
  location?: string;
  custodian_user_id?: number;
  custodian?: {
    user_id: number;
    full_name: string;
    email: string;
  };
}

export interface Workstation {
  workstation_id: number;
  workstation_name: string;
  lab_id: number;
}

// Submit a new complaint
export const submitComplaint = async (data: ComplaintData) => {
  // Format the asset_info to include asset information if selected
  let assetInfo = null;
  let assetId = null;
  if (data.selected_asset) {
    const asset = data.selected_asset;
    assetInfo = `${asset.units?.unit_name || "Unknown"} - ${
      asset.asset_details?.property_tag_no || `Asset #${asset.asset_id}`
    }`;
    assetId = asset.asset_id;
  }

  const payload = {
    lab_id: data.lab_id,
    workstation_id: data.workstation_id,
    faculty_student_name: data.faculty_student_name,
    user_type: data.user_type,
    year_level: data.year_level,
    issue_description: data.issue_description,
    asset_info: assetInfo,
    asset_id: assetId,
  };

  const response = await fetch(`${API_BASE_URL}/public-complaints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();

    // Handle rate limiting specifically
    if (response.status === 429) {
      const rateLimitMessage =
        error.error ||
        error.message ||
        "Too many form submissions. Please try again later.";
      console.error("⏰ Rate limit reached:", rateLimitMessage);
      console.error("📊 Error details:", {
        status: response.status,
        statusText: response.statusText,
        message: error.message,
      });

      // Log individual validation errors if they exist
      if (error.errors && Array.isArray(error.errors)) {
        console.error("🔍 Individual validation errors:");
        error.errors.forEach((err: any, index: number) => {
          console.error(
            `  ${index + 1}. Field: ${err.field}, Message: ${err.message}`
          );
        });
      }

      throw new Error(rateLimitMessage);
    }

    console.error("❌ Error response:", error);
    console.error("📊 Error details:", {
      status: response.status,
      statusText: response.statusText,
      message: error.message,
      errors: error.errors,
    });

    // Log individual validation errors if they exist
    if (error.errors && Array.isArray(error.errors)) {
      console.error("🔍 Individual validation errors:");
      error.errors.forEach((err: any, index: number) => {
        console.error(
          `  ${index + 1}. Field: ${err.field}, Message: ${err.message}`
        );
      });
    }

    throw new Error(error.message || "Failed to submit complaint");
  }

  return response.json();
};

// Get all laboratories
export const getLaboratories = async (): Promise<Laboratory[]> => {
  const response = await fetch(
    `${API_BASE_URL}/public-complaints/public-laboratories`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();

    // Handle rate limiting specifically
    if (response.status === 429) {
      const rateLimitMessage =
        error.error ||
        error.message ||
        "Too many form submissions. Please try again later.";
      console.error("⏰ Rate limit reached:", rateLimitMessage);
      throw new Error(rateLimitMessage);
    }

    console.error("❌ Failed to fetch laboratories:", error);
    console.error("📊 Error details:", {
      status: response.status,
      statusText: response.statusText,
      message: error.message,
    });
    throw new Error(error.message || "Failed to fetch laboratories");
  }

  return response.json();
};

// Get workstations by laboratory
export const getWorkstationsByLab = async (
  labId: number
): Promise<Workstation[]> => {
  const response = await fetch(
    `${API_BASE_URL}/public-complaints/public-laboratories/${labId}/workstations`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();

    // Handle rate limiting specifically
    if (response.status === 429) {
      const rateLimitMessage =
        error.error ||
        error.message ||
        "Too many form submissions. Please try again later.";
      console.error("⏰ Rate limit reached:", rateLimitMessage);
      throw new Error(rateLimitMessage);
    }

    console.error("❌ Failed to fetch workstations:", error);
    console.error("📊 Error details:", {
      status: response.status,
      statusText: response.statusText,
      message: error.message,
    });
    throw new Error(error.message || "Failed to fetch workstations");
  }

  return response.json();
};

// Get complaint by ID (for tracking)
export const getComplaintById = async (
  complaintId: number
): Promise<Complaint> => {
  const response = await fetch(
    `${API_BASE_URL}/public-complaints/${complaintId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch complaint");
  }

  return response.json();
};

// Get all complaints (for custodian management)
export const getComplaints = async (): Promise<Complaint[]> => {
  const response = await api.get("/complaints");
  return response.data;
};

// Update complaint status
export const updateComplaintStatus = async (
  complaintId: number,
  status: string
): Promise<void> => {
  await api.put(`/complaints/${complaintId}/status`, { status });
};

// Update complaint remarks
export const updateComplaintRemarks = async (
  complaintId: number,
  remarks: string
): Promise<void> => {
  await api.put(`/complaints/${complaintId}/remarks`, { remarks });
};

// Get complaints analytics for dashboard
export const getComplaintsAnalytics = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const url = params.toString() ? `/complaints/analytics?${params}` : '/complaints/analytics';
  const response = await api.get(url);
  return response.data;
};

export interface ComplaintsAnalyticsData {
  totalComplaints: number;
  totalResolvedComplaints: number;
  labComplaints: Array<{
    lab_name: string;
    total_count: number;
    resolved_count: number;
  }>;
}
