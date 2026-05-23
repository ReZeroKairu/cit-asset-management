import React, { useState } from "react";
import { X, Calendar, Clock, ChevronDown } from "lucide-react";
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
  onSuccess: (
    scheduledQuarters: string[],
    schedules?: Record<string, QuarterSchedule>,
    fiscalYear?: string,
  ) => void;
}

interface QuarterSchedule {
  start: string;
  end: string;
  servicingWeeks: number[];
}

// ✅ Custom Hybrid Input: Typing for MM/DD, Dropdown for YYYY
const HybridDateInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  isError?: boolean;
}> = ({ value, onChange, isError }) => {
  const parts = value ? value.split("-") : ["", "", ""];
  const y = parts[0] || "";
  const m = parts[1] || "";
  const d = parts[2] || "";

  const currentYear = new Date().getFullYear();
  // Show from 2 years ago to 7 years in the future
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i - 2);

  const handlePartChange = (part: "y" | "m" | "d", val: string) => {
    let newY = part === "y" ? val : y;
    let newM = part === "m" ? val : m;
    let newD = part === "d" ? val : d;

    // Build the string. It might be temporarily incomplete while typing.
    if (!newY && !newM && !newD) {
      onChange("");
    } else {
      onChange(`${newY}-${newM}-${newD}`);
    }
  };

  const handleBlur = (part: "m" | "d", val: string) => {
    if (!val) return;
    // Auto-pad single digits with a zero when the user clicks away
    const padded = val.padStart(2, "0");
    handlePartChange(part, padded);
  };

  return (
    <div
      className={`flex items-center w-full px-2 py-1.5 text-sm border rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden transition-colors ${
        isError
          ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/50"
          : "border-gray-300"
      }`}
    >
      <input
        type="number"
        placeholder="MM"
        value={m}
        onChange={(e) => handlePartChange("m", e.target.value.slice(0, 2))}
        onBlur={(e) => handleBlur("m", e.target.value)}
        className="w-7 outline-none text-center bg-transparent p-0 border-none focus:ring-0 text-gray-700 placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        min="1"
        max="12"
      />
      <span className="text-gray-400 select-none mx-0.5">/</span>
      <input
        type="number"
        placeholder="DD"
        value={d}
        onChange={(e) => handlePartChange("d", e.target.value.slice(0, 2))}
        onBlur={(e) => handleBlur("d", e.target.value)}
        className="w-7 outline-none text-center bg-transparent p-0 border-none focus:ring-0 text-gray-700 placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        min="1"
        max="31"
      />
      <span className="text-gray-400 select-none mx-0.5 mr-1">/</span>
      <select
        value={y}
        onChange={(e) => handlePartChange("y", e.target.value)}
        className="flex-1 outline-none bg-transparent cursor-pointer text-gray-700 p-0 border-none focus:ring-0"
      >
        <option value="">YYYY</option>
        {years.map((yr) => (
          <option key={yr} value={yr}>
            {yr}
          </option>
        ))}
      </select>
    </div>
  );
};

const SetScheduleModal: React.FC<Props> = ({ labId, onClose, onSuccess }) => {
  const [fiscalYear, setFiscalYear] = useState("2025-2026");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [weekToPopulate, setWeekToPopulate] = useState<number | "">("");

  const [schedules, setSchedules] = useState<Record<string, QuarterSchedule>>({
    "1st": { start: "", end: "", servicingWeeks: [] },
    "2nd": { start: "", end: "", servicingWeeks: [] },
    "3rd": { start: "", end: "", servicingWeeks: [] },
    "4th": { start: "", end: "", servicingWeeks: [] },
  });

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

      newWeeks.sort((a, b) => a - b);

      return {
        ...prev,
        [quarter]: { ...prev[quarter], servicingWeeks: newWeeks },
      };
    });
  };

  // Helper to ensure the date is fully formed before passing to utilities
  const isDateComplete = (dString: string) => {
    const p = dString ? dString.split("-") : [];
    // Requires YYYY-MM-DD where year is 4 digits, and month/day exist
    return p.length === 3 && p[0].length === 4 && p[1] !== "" && p[2] !== "";
  };

  const handleAutoFillDates = () => {
    const parts = fiscalYear.trim().split("-");

    if (parts.length !== 2) {
      alert("Please enter a valid fiscal year format (e.g., 2025-2026)");
      return;
    }

    const startYear = parseInt(parts[0]);
    const endYear = parseInt(parts[1]);

    if (isNaN(startYear) || isNaN(endYear) || endYear !== startYear + 1) {
      alert("Please enter valid consecutive years (e.g., 2025-2026)");
      return;
    }

    const newSchedules: Record<string, QuarterSchedule> = {
      "1st": {
        start: `${startYear}-07-01`,
        end: `${startYear}-09-30`,
        servicingWeeks: [],
      },
      "2nd": {
        start: `${startYear}-10-01`,
        end: `${startYear}-12-31`,
        servicingWeeks: [],
      },
      "3rd": {
        start: `${endYear}-01-01`,
        end: `${endYear}-03-31`,
        servicingWeeks: [],
      },
      "4th": {
        start: `${endYear}-04-01`,
        end: `${endYear}-06-30`,
        servicingWeeks: [],
      },
    };

    setSchedules(newSchedules);
  };

  const handlePopulateWeekToAllQuarters = () => {
    if (weekToPopulate === "" || typeof weekToPopulate !== "number") {
      alert("Please select a week number to populate");
      return;
    }

    let appliedCount = 0;
    const updatedSchedules = { ...schedules };

    Object.keys(schedules).forEach((quarterId) => {
      const startStr = schedules[quarterId].start;
      const endStr = schedules[quarterId].end;

      const startComplete = isDateComplete(startStr);
      const endComplete = isDateComplete(endStr);

      const isValidRange = startComplete && endComplete;

      if (isValidRange) {
        const availableWeeks = getWeeksInDateRange(startStr, endStr);
        if (availableWeeks.includes(weekToPopulate)) {
          if (
            !updatedSchedules[quarterId].servicingWeeks.includes(weekToPopulate)
          ) {
            updatedSchedules[quarterId].servicingWeeks.push(weekToPopulate);
            appliedCount++;
          }
        }
      }
    });

    if (appliedCount === 0) {
      alert(
        `Week ${weekToPopulate} is not available in any quarter with valid date ranges.`,
      );
      return;
    }

    // Sort weeks for consistency
    Object.keys(updatedSchedules).forEach((quarterId) => {
      updatedSchedules[quarterId].servicingWeeks.sort((a, b) => a - b);
    });

    setSchedules(updatedSchedules);
    alert(
      `Week ${weekToPopulate} has been added to ${appliedCount} quarter(s).`,
    );
    setWeekToPopulate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validSchedules = Object.entries(schedules)
      .filter(
        ([_, dates]) =>
          isDateComplete(dates.start) &&
          isDateComplete(dates.end) &&
          dates.servicingWeeks.length > 0,
      )
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
        "Please complete the Start Date and End Date for at least one quarter and select servicing weeks.",
      );
    }

    if (!labId) {
      return alert("Lab ID is required.");
    }

    try {
      const response = await upsertSchedules(labId, fiscalYear, schedules);

      alert(
        `Successfully scheduled ${
          response.scheduledQuarters.length
        } quarters with ${validSchedules.reduce(
          (acc, s) => acc + s.servicing_weeks.length,
          0,
        )} servicing weeks for AY ${fiscalYear}!`,
      );
      onSuccess(response.scheduledQuarters, schedules, fiscalYear);
    } catch (error) {
      console.error("Failed to save schedules:", error);
      alert("Failed to save schedules. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Set Yearly Maintenance Schedule
            </h3>
            <p className="text-sm text-gray-500">
              Define the maintenance windows and servicing weeks for the fiscal
              year.
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

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden"
        >
          <div className="flex gap-4 items-start">
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  placeholder="e.g., 2025-2026"
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAutoFillDates}
                  title="Auto-fill all quarters with standard dates"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors font-medium text-sm whitespace-nowrap shadow-sm"
                >
                  Auto-Fill
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click Auto-Fill to set standard quarter dates (Jul-Sep, Oct-Dec,
                Jan-Mar, Apr-Jun)
              </p>
            </div>

            <div className="flex-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 rounded-md">
              <h4 className="text-xs font-semibold text-amber-900 mb-2 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Populate Week
              </h4>
              <div className="flex gap-2 items-end">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={weekToPopulate}
                  onChange={(e) =>
                    setWeekToPopulate(
                      e.target.value === "" ? "" : parseInt(e.target.value),
                    )
                  }
                  placeholder="Week #"
                  className="w-20 px-2 py-1.5 border border-amber-200 rounded-md bg-white focus:ring-amber-500 focus:border-amber-500 text-xs"
                />
                <button
                  type="button"
                  onClick={handlePopulateWeekToAllQuarters}
                  disabled={weekToPopulate === ""}
                  title="Add selected week to all quarters"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium text-xs whitespace-nowrap shadow-sm"
                >
                  Apply
                </button>
              </div>
              <p className="text-xs text-amber-800 mt-2">
                Adds week to all quarters with valid dates. Enter the week
                number.
              </p>
            </div>
          </div>

          <div className="flex-1 border rounded-lg overflow-hidden flex flex-col min-h-0">
            <div className="overflow-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                      Quarter
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                      Start Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                      End Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[300px]">
                      Servicing Weeks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.keys(fiscalQuarterMonths).map((quarterId) => {
                    const startStr = schedules[quarterId].start;
                    const endStr = schedules[quarterId].end;

                    const startComplete = isDateComplete(startStr);
                    const endComplete = isDateComplete(endStr);

                    const startDate = new Date(startStr);
                    const endDate = new Date(endStr);

                    // Error only if both fields are fully filled out but are backwards
                    const isError =
                      startComplete && endComplete && startDate > endDate;
                    const isValidRange =
                      startComplete && endComplete && !isError;

                    const availableWeeks = isValidRange
                      ? getWeeksInDateRange(startStr, endStr)
                      : [];

                    return (
                      <tr key={quarterId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 align-top">
                          <div className="text-sm font-medium text-gray-900">
                            {quarterId} Quarter
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-0.5">
                            <Calendar className="w-3 h-3 mr-1" />
                            {isValidRange
                              ? getMonthsBetweenDates(startStr, endStr)
                              : "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <HybridDateInput
                            value={schedules[quarterId].start}
                            onChange={(val) =>
                              handleDateChange(quarterId, "start", val)
                            }
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <HybridDateInput
                            value={schedules[quarterId].end}
                            onChange={(val) =>
                              handleDateChange(quarterId, "end", val)
                            }
                            isError={isError}
                          />
                          {isError && (
                            <span className="text-[10px] text-red-500 mt-1 block">
                              End date must be after start
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {availableWeeks.length > 0 ? (
                            <div className="space-y-3">
                              {/* Custom Dropdown */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenDropdown(
                                      openDropdown === quarterId
                                        ? null
                                        : quarterId,
                                    )
                                  }
                                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                                >
                                  <span className="text-sm text-gray-700 italic font-small">
                                    {schedules[quarterId].servicingWeeks
                                      .length > 0
                                      ? `${schedules[quarterId].servicingWeeks.length} weeks selected`
                                      : "View available weeks..."}
                                  </span>
                                  <ChevronDown
                                    className={`w-4 h-4 text-gray-500 transition-transform ${
                                      openDropdown === quarterId
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </button>

                                {openDropdown === quarterId && (
                                  <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    <div className="p-1 flex flex-col">
                                      {availableWeeks.map((week) => {
                                        const isSelected =
                                          schedules[
                                            quarterId
                                          ].servicingWeeks.includes(week);
                                        const weekRange = formatWeekRange(
                                          schedules[quarterId].start,
                                          week,
                                        );

                                        return (
                                          <label
                                            key={week}
                                            className={`flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                                              isSelected
                                                ? "bg-blue-50 text-blue-700"
                                                : "hover:bg-gray-100 text-gray-700"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() =>
                                                handleWeekToggle(
                                                  quarterId,
                                                  week,
                                                )
                                              }
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2 cursor-pointer"
                                            />
                                            <Clock className="w-3 h-3 inline mr-1.5 opacity-70" />
                                            <span className="font-medium mr-1">
                                              Week {week}
                                            </span>
                                            <span className="text-gray-500 text-xs truncate">
                                              ({weekRange})
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Selected Weeks Summary */}
                              {schedules[quarterId].servicingWeeks.length >
                                0 && (
                                <div className="text-xs text-gray-600 bg-blue-50/50 border border-blue-100 p-2.5 rounded-md max-h-32 overflow-y-auto">
                                  <strong className="block mb-1.5 text-blue-800">
                                    Selected weeks overview:
                                  </strong>
                                  <div className="space-y-1">
                                    {schedules[quarterId].servicingWeeks.map(
                                      (week) => (
                                        <div
                                          key={week}
                                          className="flex justify-between items-center border-b border-blue-100/50 last:border-0 pb-1 last:pb-0"
                                        >
                                          <span className="font-medium text-gray-700">
                                            Week {week}:
                                          </span>
                                          <span className="text-blue-700">
                                            {formatWeekRange(
                                              schedules[quarterId].start,
                                              week,
                                            )}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              {isError
                                ? "Invalid date range"
                                : "Click '\Auto-Fill'\ button to reveal weeks..."}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
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