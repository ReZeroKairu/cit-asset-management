//frontend/src/components/maintenance/form-sections/ProceduresSection.tsx (Handles the Procedure selection logic)

import React, { useState, useEffect } from "react";
import type { ReportProcedure } from "../../../api/procedures";

interface Props {
  procedures: ReportProcedure[];
  setProcedures: (procedures: ReportProcedure[]) => void;
}

export const ProceduresSection: React.FC<Props> = ({
  procedures,
  setProcedures,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("procedure-dropdown");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleProcedure = (id: number) => {
    setProcedures(
      procedures.map((p) =>
        p.procedure_id === id
          ? {
              ...p,
              overall_status:
                p.overall_status === "Completed" ? "Pending" : "Completed",
            }
          : p,
      ),
    );
  };

  const selectAll = () => {
    const allCompleted = procedures.every(
      (p) => p.overall_status === "Completed",
    );
    setProcedures(
      procedures.map((p) => ({
        ...p,
        overall_status: allCompleted ? "Pending" : "Completed",
      })),
    );
  };

  const completedProcedures = procedures.filter(
    (p) => p.overall_status === "Completed",
  );

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Procedures</h3>
        {procedures.length > 0 && (
          <button
            type="button"
            onClick={selectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {completedProcedures.length === procedures.length
              ? "Deselect All"
              : "Select All"}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Dropdown */}
        <div className="relative" id="procedure-dropdown">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left flex justify-between items-center"
          >
            <span className="text-gray-500">
              {completedProcedures.length > 0
                ? `${completedProcedures.length} procedures selected`
                : "Select procedures..."}
            </span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border shadow-lg max-h-40 overflow-y-auto">
              {procedures
                .filter((p) => p.overall_status !== "Completed")
                .map((proc) => (
                  <button
                    key={proc.procedure_id}
                    type="button"
                    onClick={() => toggleProcedure(proc.procedure_id)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                  >
                    {proc.procedure_name}
                  </button>
                ))}
              {procedures.filter((p) => p.overall_status !== "Completed")
                .length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  All selected
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {completedProcedures.map((proc) => (
            <div
              key={proc.procedure_id}
              className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 rounded-full"
            >
              <span className="text-sm font-medium text-green-800">
                {proc.procedure_name}
              </span>
              <button
                type="button"
                onClick={() => toggleProcedure(proc.procedure_id)}
                className="text-green-600 font-bold hover:text-green-800"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
