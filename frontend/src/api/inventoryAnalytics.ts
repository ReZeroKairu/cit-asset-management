import api from './axios';

export interface InventoryAnalyticsData {
  statusDistribution: Array<{
    status_name: string;
    count: number;
    percentage: number;
  }>;
  labStatusData: Array<{
    lab_id: number;
    lab_name: string;
    Functional: number;
    "For Replacement": number;
    "For Repair": number;
    "For Upgrade": number;
    Lost: number;
    total: number;
  }>;
  summary: {
    totalAssets: number;
    functionalAssets: number;
    needsAttention: number;
    criticalAssets: number;
  };
  timelineData: Array<{
    asset_id: number;
    lab_id: number;
    asset_name: string;
    unit_name: string;
    workstation_name: string;
    lab_name: string;
    purchase_date: string;
    current_age_years: number;
    timeline_position: number;
  }>;
}

export const getInventoryAnalytics = async (): Promise<InventoryAnalyticsData> => {
  const response = await api.get('/analytics/inventory');
  return response.data;
};
