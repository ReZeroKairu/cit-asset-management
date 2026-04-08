import api from "./axios";
import type { PublicSoftwareInstallationData } from './publicForms';

// Software Installation API
export const submitSoftwareInstallation = async (formData: any) => {
  const response = await api.post('/forms/software-installations', formData);
  return response.data;
};

export const submitPublicSoftwareInstallation = async (data: PublicSoftwareInstallationData) => {
  const response = await api.post('/forms/software-installations', data);
  return response.data;
};

// Get software installations (with optional date filtering)
export const getSoftwareInstallations = async (dateFilter?: { start_date?: string; end_date?: string }) => {
  const queryParams = new URLSearchParams();
  if (dateFilter?.start_date) queryParams.append("start_date", dateFilter.start_date);
  if (dateFilter?.end_date) queryParams.append("end_date", dateFilter.end_date);

  const response = await api.get(`/forms/software-installations?${queryParams}`);
  return response.data;
};

export const updateSoftwareInstallationStatus = async (id: number, status: string) => {
  const response = await api.put(`/forms/software-installations/${id}/status`, { status });
  return response.data;
};

// Update software installation details (for custodian editing)
export const updateSoftwareInstallDetails = async (id: number, details: any) => {
  const response = await api.put(`/forms/software-installations/${id}`, details);
  return response.data;
};

// CIT Lab Users API
export const getCITLabUsersLogs = async (filters?: {
  start_date?: string;
  end_date?: string;
  laboratory?: string;
  user_type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (filters?.start_date) queryParams.append("start_date", filters.start_date);
  if (filters?.end_date) queryParams.append("end_date", filters.end_date);
  if (filters?.laboratory) queryParams.append("laboratory", filters.laboratory);
  if (filters?.user_type) queryParams.append("user_type", filters.user_type);
  if (filters?.search) queryParams.append("search", filters.search);
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());
  if (filters?.offset) queryParams.append("offset", filters.offset.toString());

  // Use the enhanced API with view-based data
  const response = await api.get(`/public-forms/cit-lab-users?${queryParams}`);
  return response.data;
};

// Get CIT Lab Users analytics and statistics
export const getCITLabUsersAnalytics = async (filters?: {
  laboratory?: string;
  start_date?: string;
  end_date?: string;
  group_by?: 'laboratory' | 'usage_type' | 'user_type' | 'month' | 'day_of_week' | 'time_of_day';
}) => {
  const queryParams = new URLSearchParams();
  if (filters?.laboratory) queryParams.append("laboratory", filters.laboratory);
  if (filters?.start_date) queryParams.append("start_date", filters.start_date);
  if (filters?.end_date) queryParams.append("end_date", filters.end_date);
  if (filters?.group_by) queryParams.append("group_by", filters.group_by);

  const response = await api.get(`/public-forms/cit-lab-users/analytics?${queryParams}`);
  return response.data;
};

// Get recent CIT Lab Users logs (for dashboard)
export const getRecentCITLabUsersLogs = async (limit: number = 50) => {
  const response = await api.get(`/public-forms/cit-lab-users/recent?limit=${limit}`);
  return response.data;
};
