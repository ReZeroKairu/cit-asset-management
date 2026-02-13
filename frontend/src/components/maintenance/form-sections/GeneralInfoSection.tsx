//frontend/src/components/maintenance/form-sections/GeneralInfoSection.tsx (Handles the top inputs: Lab, Date, Quarter)

import React from "react";

interface Props {
  labName?: string;
  reportDate: string;
  quarter: string;
  onDateChange: (date: string) => void;
  onQuarterChange: (quarter: string) => void;
}

export const GeneralInfoSection: React.FC<Props> = ({
  labName,
  reportDate,
  quarter,
  onDateChange,
  onQuarterChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Laboratory
        </label>
        <input
          type="text"
          disabled
          value={labName || "Loading..."}
          className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          required
          value={reportDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Service Quarter
        </label>
        <select
          value={quarter}
          onChange={(e) => onQuarterChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="1st">1st Quarter (Jan-Mar)</option>
          <option value="2nd">2nd Quarter (Apr-Jun)</option>
          <option value="3rd">3rd Quarter (Jul-Sep)</option>
          <option value="4th">4th Quarter (Oct-Dec)</option>
        </select>
      </div>
    </div>
  );
};
