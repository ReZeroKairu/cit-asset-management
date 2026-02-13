//fronted/src/api/dailyReports.ts
import api from "./axios";

export interface DailyReport {
  report_id: number;
  user_id: number;
  lab_id: number;
  report_date: string;
  time_in?: string;
  time_out?: string;
  general_remarks?: string;
  status: "Pending" | "Approved";
  created_at?: string;
  users?: {
    user_id: number;
    full_name: string;
    email: string;
  };
  laboratories?: {
    lab_id: number;
    lab_name: string;
    location?: string;
  };
  report_checklist_items?: ChecklistItem[];
  workstation_items?: {
    workstation_id: number;
    workstation_name: string;
    status: string;
    remarks?: string;
    workstation?: {
      workstation_id: number;
      workstation_name: string;
    };
  }[];
  procedures?: {
    procedure_id: number;
    procedure_name: string;
    overall_status: string;
    overall_remarks?: string;
    checklists?: {
      checklist_id: number;
      checklist_name: string;
      status: string;
      remarks?: string;
    }[];
  }[];
}

export interface ChecklistItem {
  item_id: number;
  report_id: number;
  task_id: number;
  task_status: "Done" | "Issue Found" | "N/A";
  specific_remarks?: string;
  standard_tasks?: {
    task_id: number;
    task_name: string;
    category?: string;
  };
}

export interface StandardTask {
  task_id: number;
  task_name: string;
  category?: string;
}

export interface Laboratory {
  lab_id: number;
  lab_name: string;
  location?: string;
}

// Get all daily reports (Admin only)
export const getAllDailyReports = async (params?: {
  lab_id?: number;
  user_id?: number;
  start_date?: string;
  end_date?: string;
  exclude_status?: string;
  status?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.lab_id) queryParams.append("lab_id", params.lab_id.toString());
  if (params?.user_id) queryParams.append("user_id", params.user_id.toString());
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  // Only add exclude_status if it's provided
  if (params?.exclude_status !== undefined) queryParams.append("exclude_status", params.exclude_status);
  // Add status filter if provided
  if (params?.status) queryParams.append("status", params.status);

  const response = await api.get(`/daily-reports?${queryParams}`);
  return response.data;
};

// Get current user's assigned laboratory
export const getUserAssignedLab = async () => {
  const response = await api.get("/users/assigned-lab");
  return response.data;
};

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ArchivedReportsResponse {
  reports: DailyReport[];
  pagination: PaginationInfo;
}

// Get archived daily reports
export const getArchivedReports = async (filters?: {
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}): Promise<ArchivedReportsResponse> => {
  const params = new URLSearchParams();
  if (filters?.start_date) params.append("start_date", filters.start_date);
  if (filters?.end_date) params.append("end_date", filters.end_date);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());

  const response = await api.get(`/daily-reports/archived?${params}`);
  return response.data;
};

// Get current user's daily reports
export const getMyDailyReports = async (filters?: {
  start_date?: string;
  end_date?: string;
}): Promise<DailyReport[]> => {
  const params = new URLSearchParams();
  if (filters?.start_date) params.append("start_date", filters.start_date);
  if (filters?.end_date) params.append("end_date", filters.end_date);
  // Always exclude approved reports - they go to archived
  params.append("exclude_status", "Approved");

  const response = await api.get(`/daily-reports/my?${params}`);
  return response.data;
};

// Get single daily report by ID
export const getDailyReportById = async (id: number) => {
  const response = await api.get(`/daily-reports/${id}`);
  return response.data;
};

// Create new daily report
export const createDailyReport = async (data: {
  lab_id: number;
  report_date: string;
  time_in?: string;
  time_out?: string;
  general_remarks?: string;
  checklist_items?: {
    task_id: number;
    task_status?: "Done" | "Issue Found" | "N/A";
    specific_remarks?: string;
  }[];
}) => {
  const response = await api.post("/daily-reports", data);
  return response.data;
};

// Update daily report
export const updateDailyReport = async (
  id: number,
  data: {
    time_in?: string;
    time_out?: string;
    general_remarks?: string;
    status?: "Pending" | "Approved";
    checklist_items?: {
      task_id: number;
      task_status?: "Done" | "Issue Found" | "N/A";
      specific_remarks?: string;
    }[];
  },
) => {
  const response = await api.put(`/daily-reports/${id}`, data);
  return response.data;
};

// Delete daily report (Admin only)
export const deleteDailyReport = async (id: number) => {
  const response = await api.delete(`/daily-reports/${id}`);
  return response.data;
};

// Get laboratories for dropdown
export const getLaboratories = async () => {
  const response = await api.get("/laboratories");
  return response.data;
};
