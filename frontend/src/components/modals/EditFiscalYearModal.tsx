import React, { useState } from "react";

interface EditFiscalYearModalProps {
  currentFiscalYear: string;
  onClose: () => void;
  onSave: (newFiscalYear: string) => void;
}

const EditFiscalYearModal: React.FC<EditFiscalYearModalProps> = ({
  currentFiscalYear,
  onClose,
  onSave,
}) => {
  const [fiscalYear, setFiscalYear] = useState(currentFiscalYear);
  const [error, setError] = useState("");

  const handleSave = () => {
    // Validate fiscal year format (e.g., 2025-2026)
    const fiscalYearRegex = /^\d{4}-\d{4}$/;

    if (!fiscalYearRegex.test(fiscalYear)) {
      setError(
        "Please enter fiscal year in format YYYY-YYYY (e.g., 2025-2026)",
      );
      return;
    }

    // Validate that the end year is greater than start year
    const [startYear, endYear] = fiscalYear.split("-").map(Number);
    if (endYear !== startYear + 1) {
      setError("End year must be one year after the start year");
      return;
    }

    onSave(fiscalYear);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Edit Fiscal Year
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fiscal Year
          </label>
          <input
            type="text"
            value={fiscalYear}
            onChange={(e) => {
              setFiscalYear(e.target.value);
              setError("");
            }}
            placeholder="e.g., 2025-2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Format: YYYY-YYYY</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFiscalYearModal;
