import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Plus } from "lucide-react";
// ✅ Combined imports into a single, safe relative path
import {
  fiscalQuarterMonths,
  getMonthsBetweenDates,
  getWeeksInDateRange,
  formatWeekRange,
} from "../../utils/quarterLogic";
import { upsertSchedules } from "../../api/schedule";

interface Props {
  labId: number | null;
  onClose: () => void;
  onSuccess: (scheduledQuarters: string[], schedules?: Record<string, QuarterSchedule>, fiscalYear?: string) => void;
}

interface QuarterSchedule {
  start: string;
  end: string;
  servicingWeeks: number[];
}

const SetScheduleModal: React.FC<Props> = ({ labId, onClose, onSuccess }) => {
  const [fiscalYear, setFiscalYear] = useState("2025-2026");

  const [schedules, setSchedules] = useState<Record<string, QuarterSchedule>>(
    {
      "1st": { start: "", end: "", servicingWeeks: [] },
      "2nd": { start: "", end: "", servicingWeeks: [] },
      "3rd": { start: "", end: "", servicingWeeks: [] },
      "4th": { start: "", end: "", servicingWeeks: [] },
    }
  );

  // Load existing schedules when modal opens
  useEffect(() => {
    if (labId) {
      // TODO: Replace with actual API call to load existing schedules
      // For now, the form starts empty and users can create new schedules
    }
  }, [labId]);

  const handleCreateNewSchedule = () => {
    setSchedules({
      "1st": { start: "", end: "", servicingWeeks: [] },
      "2nd": { start: "", end: "", servicingWeeks: [] },
      "3rd": { start: "", end: "", servicingWeeks: [] },
      "4th": { start: "", end: "", servicingWeeks: [] },
    });
  };

  const handleDateChange = (
    quarter: string,
    field: "start" | "end",
    value: string,
  ) => {
    setSchedules((prev) => ({
      ...prev,
      [quarter]: { ...prev[quarter], [field]: value, servicingWeeks: [] },
    }));
  };

  const handleWeekToggle = (quarter: string, week: number) => {
    setSchedules((prev) => {
      const currentWeeks = prev[quarter].servicingWeeks;
      const newWeeks = currentWeeks.includes(week)
        ? currentWeeks.filter((w) => w !== week)
        : [...currentWeeks, week];
      
      return {
        ...prev,
        [quarter]: { ...prev[quarter], servicingWeeks: newWeeks },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validSchedules = Object.entries(schedules)
      .filter(([_, dates]) => dates.start && dates.end && dates.servicingWeeks.length > 0)
      .map(([quarter, dates]) => ({
        lab_id: labId,
        quarter,
        fiscal_year: fiscalYear,
        start_date: dates.start,
        end_date: dates.end,
        servicing_weeks: dates.servicingWeeks,
      }));

    if (validSchedules.length === 0) {
      return alert(
        "Please set the start and end dates for at least one quarter and select servicing weeks.",
      );
    }

    if (!labId) {
      return alert("Lab ID is required.");
    }

    try {
      // Call the API to save schedules
      const response = await upsertSchedules(labId, fiscalYear, schedules);
      
      alert(
        `Successfully scheduled ${response.scheduledQuarters.length} quarters with ${validSchedules.reduce((acc, s) => acc + s.servicing_weeks.length, 0)} servicing weeks for AY ${fiscalYear}!`,
      );
      onSuccess(response.scheduledQuarters, schedules, fiscalYear);
    } catch (error) {
      console.error("Failed to save schedules:", error);
      alert("Failed to save schedules. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Set Yearly Maintenance Schedule
            </h3>
            <p className="text-sm text-gray-500">
              Define the maintenance windows and servicing weeks for the fiscal year.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
          <div className="w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <input
              type="text"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="e.g., 2025-2026"
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex-1 border rounded-lg overflow-hidden flex flex-col min-h-0">
            <div className="overflow-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quarter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    End Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[300px]">
                    Servicing Weeks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* ✅ We ignore monthsLabel now by using Object.keys since it is dynamic */}
                {Object.keys(fiscalQuarterMonths).map((quarterId) => {
                  const availableWeeks = getWeeksInDateRange(
                    schedules[quarterId].start,
                    schedules[quarterId].end
                  );
                  
                  return (
                    <tr key={quarterId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {quarterId} Quarter
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                          <Calendar className="w-3 h-3 mr-1" />
                          {getMonthsBetweenDates(
                            schedules[quarterId].start,
                            schedules[quarterId].end,
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={schedules[quarterId].start}
                          onChange={(e) =>
                            handleDateChange(quarterId, "start", e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={schedules[quarterId].end}
                          onChange={(e) =>
                            handleDateChange(quarterId, "end", e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {availableWeeks.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {availableWeeks.map((week) => {
                                const weekRange = formatWeekRange(
                                  schedules[quarterId].start,
                                  week
                                );
                                
                                return (
                                  <button
                                    key={week}
                                    type="button"
                                    onClick={() => handleWeekToggle(quarterId, week)}
                                    className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                                      schedules[quarterId].servicingWeeks.includes(week)
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                    title={`Week ${week}: ${weekRange}`}
                                  >
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    W{week}
                                  </button>
                                );
                              })}
                            </div>
                            {schedules[quarterId].servicingWeeks.length > 0 && (
                              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                <strong>Selected weeks:</strong>
                                <div className="mt-1 space-y-1">
                                  {schedules[quarterId].servicingWeeks.map((week) => (
                                    <div key={week} className="flex justify-between">
                                      <span>Week {week}:</span>
                                      <span className="text-blue-700">{formatWeekRange(schedules[quarterId].start, week)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Set dates to see weeks
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Save Schedules
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetScheduleModal;
