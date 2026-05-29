import React from "react";
import ProcedureDropdown from "./ProcedureDropdown";
import WorkstationDropdown from "./WorkstationDropdown";
import type { ReportProcedure } from "../../api/procedures";

interface MaintenanceSectionProps {
  allProcedures: ReportProcedure[]; // Renamed from procedures
  workstations: any[];
  maintenanceServices: any[];
  remarks: string;
  onRemarksChange: (value: string) => void;
  onToggleProcedure: (procedureId: number, isSelected: boolean) => void; // New prop
  onWorkstationSelect: (workstationId: number) => void;
  onWorkstationDeselect: (workstationId: number) => void;
  onWorkstationSelectAll: () => void;
  onWorkstationDeselectAll: () => void;
  isProcedureDropdownOpen: boolean;
  onProcedureDropdownToggle: () => void;
  procedureSearch: string;
  onProcedureSearchChange: (value: string) => void;
  isWorkstationDropdownOpen: boolean;
  onWorkstationDropdownToggle: () => void;
  workstationSearch: string;
  onWorkstationSearchChange: (value: string) => void;
}

const MaintenanceSection: React.FC<MaintenanceSectionProps> = ({
  allProcedures,
  workstations,
  maintenanceServices,
  remarks,
  onRemarksChange,
  onToggleProcedure,
  onWorkstationSelect,
  onWorkstationDeselect,
  onWorkstationSelectAll,
  onWorkstationDeselectAll,
  isProcedureDropdownOpen,
  onProcedureDropdownToggle,
  procedureSearch,
  onProcedureSearchChange,
  isWorkstationDropdownOpen,
  onWorkstationDropdownToggle,
  workstationSearch,
  onWorkstationSearchChange,
}) => {
  // Start with default maintenance IDs
  const relevantIds = [1, 3, 4, 7];

  // Dynamically add procedure IDs found in the actual maintenance services
  maintenanceServices.forEach(service => {
    const serviceProcs = service.procedures || service.procedure_ids || [];
    serviceProcs.forEach((p: any) => {
      const id = typeof p === 'object' ? Number(p.procedure_id) : Number(p);
      if (id && !relevantIds.includes(id)) {
        relevantIds.push(id);
      }
    });
  });

  const darIds = [1, 2, 3, 4, 5, 6, 7];
  const relevantProcedures = allProcedures.filter(p => relevantIds.includes(Number(p.procedure_id)));
  const allRelevantCompleted = relevantProcedures.length > 0 && relevantProcedures.every((proc) => proc.overall_status === "Completed");

  const handleSelectAllProcedures = () => {
    relevantProcedures.forEach(proc => {
      onToggleProcedure(proc.procedure_id, !allRelevantCompleted);
    });
  };


  if (maintenanceServices.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-center">No maintenance services data found in this unified report</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
        🔧 Maintenance Section
      </h2>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            ✅ Procedures ({allProcedures.filter((p: any) => p.overall_status === "Completed").length})
          </h3>
          {relevantProcedures.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllProcedures}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {allRelevantCompleted ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>
        <ProcedureDropdown
          allProcedures={allProcedures}
          isOpen={isProcedureDropdownOpen}
          onToggle={onProcedureDropdownToggle}
          searchValue={procedureSearch}
          onSearchChange={onProcedureSearchChange}
          onToggleProcedure={onToggleProcedure}
          dropdownId="procedure-dropdown-maintenance"
          filterIds={relevantIds}
          dropdownFilterIds={darIds}
        />
      </div>

      <WorkstationDropdown
        workstations={workstations}
        isOpen={isWorkstationDropdownOpen}
        onToggle={onWorkstationDropdownToggle}
        searchValue={workstationSearch}
        onSearchChange={onWorkstationSearchChange}
        onSelect={onWorkstationSelect}
        onDeselect={onWorkstationDeselect}
        dropdownId="workstation-dropdown-maintenance"
        onSelectAll={onWorkstationSelectAll}
        onDeselectAll={onWorkstationDeselectAll}
      />

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          📝 Remarks
        </h3>
        <div className="bg-white p-3 rounded border border-gray-200">
          <textarea
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 min-h-[100px]"
            placeholder="Enter maintenance remarks..."
          />
        </div>
      </div>
    </div>
  );
};

export default MaintenanceSection;
