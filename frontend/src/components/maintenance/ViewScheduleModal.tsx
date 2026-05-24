import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, Clock, Plus } from "lucide-react";
import {
  fiscalQuarterMonths,
  getMonthsBetweenDates,
  formatWeekRange,
} from "../../utils/quarterLogic";
import { getLabSchedules } from "../../api/schedule";

interface Props {
  labId: number | null;
  onClose: () => void;
  onSetSchedule: () => void;
  existingSchedules?: Record<string, QuarterSchedule>;
  fiscalYear?: string;
}

interface QuarterSchedule {
  start: string;
  end: string;
  servicingWeeks: number[];
}

const ViewScheduleModal: React.FC<Props> = ({ 
  labId, 
  onClose, 
  onSetSchedule, 
  existingSchedules,
  fiscalYear: propFiscalYear 
}) => {
  const [fiscalYear, setFiscalYear] = useState(propFiscalYear || "2025-2026");
  const [schedules, setSchedules] = useState<Record<string, QuarterSchedule>>({});
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load existing schedules when modal opens
  useEffect(() => {
    if (labId) {
      loadSchedules();
    }
  }, [labId, fiscalYear]);

  // Handle ESC key and click outside to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      // If existing schedules are provided, use them
      if (existingSchedules) {
        setSchedules(existingSchedules);
        setLoading(false);
        return;
      }

      // Otherwise fetch from API
      if (!labId) return;
      const fetchedSchedules = await getLabSchedules(labId, fiscalYear);
      
      // Initialize with default empty schedules for any missing quarters
      const defaultSchedules: Record<string, QuarterSchedule> = {
        "1st": { start: "", end: "", servicingWeeks: [] },
        "2nd": { start: "", end: "", servicingWeeks: [] },
        "3rd": { start: "", end: "", servicingWeeks: [] },
        "4th": { start: "", end: "", servicingWeeks: [] },
      };

      // Merge fetched schedules with defaults
      const mergedSchedules = { ...defaultSchedules, ...fetchedSchedules };
      setSchedules(mergedSchedules);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load schedules:", error);
      setLoading(false);
    }
  };

  const hasAnySchedules = Object.values(schedules).some(
    schedule => schedule.start && schedule.end && schedule.servicingWeeks.length > 0
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Yearly Maintenance Schedule
            </h3>
            <p className="text-sm text-gray-500">
              View the maintenance windows and servicing weeks for the fiscal year.
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

        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
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
              disabled
            />
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-500">Loading schedules...</div>
            </div>
          ) : !hasAnySchedules ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Set</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                No maintenance schedule has been set for this laboratory. Click the "Set a Schedule" button to create a new maintenance schedule.
              </p>
              <button
                type="button"
                onClick={onSetSchedule}
                className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Set a Schedule
              </button>
            </div>
          ) : (
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
                    {Object.keys(fiscalQuarterMonths).map((quarterId) => {
                      const schedule = schedules[quarterId];
                      
                      return (
                        <tr key={quarterId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {quarterId} Quarter
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                              <Calendar className="w-3 h-3 mr-1" />
                              {getMonthsBetweenDates(schedule.start, schedule.end)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {schedule.start ? (
                              <div className="text-sm text-gray-900">
                                {new Date(schedule.start).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Not set</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {schedule.end ? (
                              <div className="text-sm text-gray-900">
                                {new Date(schedule.end).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Not set</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {schedule.servicingWeeks.length > 0 ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                  {schedule.servicingWeeks.map((week) => {
                                    const weekRange = formatWeekRange(schedule.start, week);
                                    
                                    return (
                                      <span
                                        key={week}
                                        className="px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-700 cursor-default"
                                        title={`Week ${week}: ${weekRange}`}
                                      >
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        W{week}
                                      </span>
                                    );
                                  })}
                                </div>
                                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                  <strong>Selected weeks:</strong>
                                  <div className="mt-1 space-y-1">
                                    {schedule.servicingWeeks.map((week) => (
                                      <div key={week} className="flex justify-between">
                                        <span>Week {week}:</span>
                                        <span className="text-blue-700">{formatWeekRange(schedule.start, week)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                No servicing weeks
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewScheduleModal;
