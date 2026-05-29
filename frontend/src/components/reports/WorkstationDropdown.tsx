import React from "react";
import { Monitor } from "lucide-react";

interface WorkstationDropdownProps {
  workstations: any[];
  isOpen: boolean;
  onToggle: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect: (workstationId: number) => void;
  onDeselect: (workstationId: number) => void;
  dropdownId: string;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const WorkstationDropdown: React.FC<WorkstationDropdownProps> = ({
  workstations,
  isOpen,
  onToggle,
  searchValue,
  onSearchChange,
  onSelect,
  onDeselect,
  dropdownId,
  onSelectAll,
  onDeselectAll,
}) => {
  const checkedWorkstations = workstations.filter((ws) => ws.checked);
  const allChecked = workstations.length > 0 && workstations.every((ws) => ws.checked);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          💻 Workstations ({checkedWorkstations.length})
        </h3>
        {workstations.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (allChecked) {
                onDeselectAll();
              } else {
                onSelectAll();
              }
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {allChecked ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>
      
      {/* Custom Workstation Dropdown with Integrated Search */}
      <div className="relative" id={dropdownId}>
        <div className="relative">
          <input
            type="text"
            value={isOpen ? searchValue : (checkedWorkstations.length > 0 ? `${checkedWorkstations.length} workstations selected` : "")}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (!isOpen) {
                onToggle();
              }
            }}
            onFocus={() => {
              onToggle();
            }}
            placeholder={checkedWorkstations.length > 0 ? "" : "Select workstations..."}
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
            {workstations
              .filter((ws) =>
                ws.workstation_name
                  .toLowerCase()
                  .includes(searchValue.toLowerCase())
              )
                .map((workstation) => (
                  <button
                    key={workstation.workstation_id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (workstation.checked) {
                        onDeselect(workstation.workstation_id);
                        onSearchChange("");
                      } else {
                        onSelect(workstation.workstation_id);
                        onSearchChange("");
                      }
                    }}
                  className={`w-full px-4 py-2 text-left transition-colors text-sm flex items-center justify-between gap-2 ${
                    workstation.checked ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Monitor className={`w-4 h-4 ${workstation.checked ? "text-blue-600" : "text-gray-500"}`} />
                    {workstation.workstation_name}
                  </div>
                  {workstation.checked && <span className="text-xs font-bold">✓ Added</span>}
                </button>
              ))}
            {workstations
              .filter((ws) =>
                ws.workstation_name
                  .toLowerCase()
                  .includes(searchValue.toLowerCase())
              ).length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                {searchValue
                  ? "No matching workstations found" : "No workstations registered for this laboratory"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Workstations */}
      <div className="flex flex-wrap gap-2">
        {checkedWorkstations.map((workstation) => (
          <div
            key={workstation.workstation_id}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full"
          >
            <span className="text-sm font-medium text-blue-800">
              {workstation.workstation_name}
            </span>
            <button
              type="button"
              onClick={() => onDeselect(workstation.workstation_id)}
              className="text-blue-600 hover:text-blue-800 font-bold text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
        {checkedWorkstations.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No workstations selected
          </p>
        )}
      </div>
    </div>
  );
};

export default WorkstationDropdown;
