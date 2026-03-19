import api from "./axios";

export interface ScheduleData {
  [quarter: string]: {
    start: string;
    end: string;
    servicingWeeks: number[];
  };
}

export interface ScheduleResponse {
  message: string;
  scheduledQuarters: string[];
}

// Get all schedules for a lab and fiscal year
export const getLabSchedules = async (labId: number, fiscalYear: string): Promise<ScheduleData> => {
  try {
    // Notice the relative path! No ${API_BASE_URL}
    const response = await api.get(`/maintenance/schedules`, {
      params: {
        lab_id: labId,
        fiscal_year: fiscalYear,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    throw error;
  }
};

// Create or update schedules for a lab
export const upsertSchedules = async (
  labId: number,
  fiscalYear: string,
  schedules: ScheduleData
): Promise<ScheduleResponse> => {
  try {
    // Notice the relative path!
    const response = await api.post(`/maintenance/schedules`, {
      lab_id: labId,
      fiscal_year: fiscalYear,
      schedules,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to save schedules:", error);
    throw error;
  }
};

// Delete all schedules for a lab and fiscal year
export const deleteLabSchedules = async (labId: number, fiscalYear: string): Promise<{ message: string; deletedCount: number }> => {
  try {
    // Notice the relative path!
    const response = await api.delete(`/maintenance/schedules`, {
      params: {
        lab_id: labId,
        fiscal_year: fiscalYear,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to delete schedules:", error);
    throw error;
  }
};