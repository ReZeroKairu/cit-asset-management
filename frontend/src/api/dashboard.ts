//frontend/src/api/dashboard.ts
import api from './axios';

export interface DashboardStats {
  totalAssets: number;
  totalLaboratories: number;
  totalDailyReports: number;
  totalUsers: number;
  totalForms: number;
}

export interface RecentReport {
  report_id: number;
  report_date: string;
  status: string;
  users: {
    full_name: string;
  };
  laboratories: {
    lab_name: string;
  };
}

export interface AssetsByLab {
  lab_id: number;
  lab_name: string;
  asset_count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentReports: RecentReport[];
  assetsByLab: AssetsByLab[];
  userAssignedLab: {
    lab_id: number;
    lab_name: string;
    location: string;
  } | null;
  userRole: string;
}

export const getDashboardStats = async (): Promise<DashboardData> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};
