import React, { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
// ✅ Combined imports into a single, safe relative path
import {
  fiscalQuarterMonths,
  getMonthsBetweenDates,
} from "../../utils/quarterLogic";

interface Props {
  labId: number | null;
  onClose: () => void;
  onSuccess: (scheduledQuarters: string[]) => void;
}

const SetScheduleModal: React.FC<Props> = ({ labId, onClose, onSuccess }) => {
  const [fiscalYear, setFiscalYear] = useState("2025-2026");

  const [schedules, setSchedules] = useState<
    Record<string, { start: string; end: string }>
  >({
    "1st": { start: "", end: "" },
    "2nd": { start: "", end: "" },
    "3rd": { start: "", end: "" },
    "4th": { start: "", end: "" },
  });

  // Add ESC key support
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const handleDateChange = (
    quarter: string,
    field: "start" | "end",
    value: string,
  ) => {
    setSchedules((prev) => ({
      ...prev,
      [quarter]: { ...prev[quarter], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validSchedules = Object.entries(schedules)
      .filter(([_, dates]) => dates.start && dates.end)
      .map(([quarter, dates]) => ({
        lab_id: labId,
        quarter,
        fiscal_year: fiscalYear,
        start_date: dates.start,
        end_date: dates.end,
      }));

    if (validSchedules.length === 0) {
      return alert(
        "Please set the start and end dates for at least one quarter.",
      );
    }

    // Backend call goes here later
    // await api.post('/maintenance/schedule/batch', { schedules: validSchedules });

    const scheduledQuarterNames = validSchedules.map((s) => s.quarter);
    alert(
      `Successfully scheduled ${scheduledQuarterNames.length} quarters for AY ${fiscalYear}!`,
    );
    onSuccess(scheduledQuarterNames);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Set Yearly Maintenance Schedule
            </h3>
            <p className="text-sm text-gray-500">
              Define the maintenance windows for the fiscal year.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic / Fiscal Year
            </label>
            <input
              type="text"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="e.g., 2025-2026"
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* ✅ We ignore monthsLabel now by using Object.keys since it is dynamic */}
                {Object.keys(fiscalQuarterMonths).map((quarterId) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
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
              className="px-4 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
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
