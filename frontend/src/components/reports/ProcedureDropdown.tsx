import React from "react";
import type { ReportProcedure } from "../../api/procedures";

interface ProcedureDropdownProps {
  allProcedures: ReportProcedure[]; // Renamed to avoid confusion
  isOpen: boolean;
  onToggle: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onToggleProcedure: (procedureId: number, isSelected: boolean) => void; // New prop for toggling
  dropdownId: string;
  filterIds?: number[]; // Only show pills for these IDs
  dropdownFilterIds?: number[]; // Only show in list for these IDs
}

const ProcedureDropdown: React.FC<ProcedureDropdownProps> = ({
  allProcedures,
  isOpen,
  onToggle,
  searchValue,
  onSearchChange,
  onToggleProcedure,
  dropdownId,
  filterIds,
  dropdownFilterIds,
}) => {
  // Procedures that are currently selected for THIS section (to show as pills)
  // Removed filterIds check here to allow any selected procedure to show as a pill
  const selectedProceduresForSection = allProcedures.filter((proc) =>
    proc.overall_status === "Completed"
  );

  return (
    <div className="space-y-4">
      {/* Custom Procedure Dropdown with Integrated Search */}
      <div className="relative" id={dropdownId}>
        <div className="relative">
          <input // Display selected count or search value
            type="text"
            value={isOpen ? searchValue : (selectedProceduresForSection.length > 0 ? `${selectedProceduresForSection.length} procedures selected` : "")}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (!isOpen) {
                onToggle();
              }
            }}
            onFocus={() => {
              onToggle();
            }}
            placeholder={selectedProceduresForSection.length > 0 ? "" : "Select procedures..."}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-left pr-10"
          />
          <button
            type="button"
            onClick={() => onToggle()}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
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
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {allProcedures // Filter the global list for display in the dropdown
              .filter((proc) => !dropdownFilterIds || dropdownFilterIds.includes(Number(proc.procedure_id)))
              .filter((proc) =>
                proc.procedure_name
                  .toLowerCase()
                  .includes(searchValue.toLowerCase())
              )
              .map((procedure) => {
                const isSelected = procedure.overall_status === "Completed"; // Check global status
                return (
                  <button
                  key={procedure.procedure_id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle the procedure's status for this section
                    onToggleProcedure(procedure.procedure_id, !isSelected);
                    onSearchChange("");
                  }}
                  className={`w-full px-4 py-2 text-left transition-colors text-sm flex items-center justify-between ${
                    isSelected ? "bg-green-50 text-green-700 font-medium" : "hover:bg-blue-50"
                  }`}
                >
                  {procedure.procedure_name}
                  {isSelected && (
                    <span className="text-xs font-bold">✓ Selected</span>
                  )}
                </button>
                );
              })}
            {allProcedures
              .filter((proc) => !dropdownFilterIds || dropdownFilterIds.includes(Number(proc.procedure_id)))
              .filter((proc) =>
                proc.procedure_name
                  .toLowerCase()
                  .includes(searchValue.toLowerCase())
              ).length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                {searchValue
                  ? "No matching procedures found"
                  : "No procedures available for this section"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Procedures */}
      <div className="flex flex-wrap gap-2"> {/* Display pills for selected procedures */}
        {selectedProceduresForSection.map((procedure) => (
          <div
            key={procedure.procedure_id}
            className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full"
          >
            <span className="text-sm font-medium text-green-800">
              {procedure.procedure_name}
            </span>
            <button
              type="button"
              onClick={() => onToggleProcedure(procedure.procedure_id, false)} // Deselect
              className="text-green-600 hover:text-green-800 font-bold text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
        {selectedProceduresForSection.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No procedures selected
          </p>
        )}
      </div>
    </div>
  );
};

export default ProcedureDropdown;
