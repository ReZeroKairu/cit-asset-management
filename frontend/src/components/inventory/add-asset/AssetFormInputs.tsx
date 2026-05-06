import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, Search, ChevronDown } from "lucide-react";
import { getUnits } from "../../../api/inventory";
import AddUnitModal from "./AddUnitModal";

interface Props {
  formData: any;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  deviceTypes: any[];
  filteredUnits: any[];
  labs: any[];
  workstations: any[];
  preselectedWorkstation?: any;
  userRole?: string;
  units: any[];
  setUnits: (units: any[]) => void;
}

const AssetFormInputs: React.FC<Props> = ({
  formData,
  handleChange,
  deviceTypes,
  filteredUnits,
  labs,
  workstations,
  preselectedWorkstation,
  userRole,
  units,
  setUnits,
}) => {
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isWorkstationDropdownOpen, setIsWorkstationDropdownOpen] = useState(false);
  const [workstationSearchTerm, setWorkstationSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWorkstationDropdownOpen(false);
      }
    };

    if (isWorkstationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWorkstationDropdownOpen]);

  const handleAddUnit = async () => {
    // Refresh the units list
    try {
      const updatedUnits = await getUnits();
      setUnits(updatedUnits);
    } catch (error) {
      console.error("Failed to refresh units:", error);
    }
  };

  const getCurrentDeviceType = () => {
    return deviceTypes.find(dt => dt.device_type_id === Number(formData.device_type));
  };
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-inner">
      {/* Device Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Device Type <span className="text-red-500">*</span>
        </label>
        <select
          name="device_type"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
          value={formData.device_type}
          onChange={handleChange}
        >
          <option value="">Select Device Type...</option>
          {deviceTypes.map((dt) => (
            <option key={dt.device_type_id} value={dt.device_type_id}>
              {dt.device_type_name}
            </option>
          ))}
        </select>
      </div>

      {/* Unit Name */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-semibold text-gray-700">
            Unit Name <span className="text-red-500">*</span>
          </label>
          {formData.device_type && (
            <button
              type="button"
              onClick={() => setIsAddUnitModalOpen(true)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              title="Add new unit"
            >
              <PlusCircle className="w-4 h-4" />
              Add Unit
            </button>
          )}
        </div>
        <select
          name="unit_id"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white disabled:bg-gray-100 disabled:text-gray-400"
          value={formData.unit_id}
          onChange={handleChange}
          disabled={!formData.device_type}
        >
          <option value="">
            {!formData.device_type
              ? "Select Device Type First..."
              : "Select Unit..."}
          </option>
          {filteredUnits
            .sort((a, b) => a.unit_name.localeCompare(b.unit_name))
            .map((unit) => (
              <option key={unit.unit_id} value={unit.unit_id}>
                {unit.unit_name}
              </option>
            ))}
        </select>
      </div>

      {/* Laboratory */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Laboratory <span className="text-red-500">*</span>
        </label>
        <select
          name="lab_id"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-600 bg-white"
          value={formData.lab_id}
          onChange={handleChange}
          disabled={!!preselectedWorkstation || userRole === "Custodian"}
        >
          <option value="">Select Lab...</option>
          {labs.map((lab) => (
            <option key={lab.lab_id} value={lab.lab_id}>
              {lab.lab_name}
            </option>
          ))}
        </select>
      </div>

      {/* Workstation */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Workstation (Optional)
        </label>
        <div className="relative" ref={dropdownRef}>
          {/* Selected Workstation Display */}
          {formData.workstation_id && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
              {workstations.find(ws => ws.workstation_id === Number(formData.workstation_id))?.workstation_name}
            </div>
          )}
          
          {/* Searchable Dropdown */}
          <div className="relative">
            <input
              type="text"
              placeholder={formData.workstation_id ? `Selected: ${workstations.find(ws => ws.workstation_id === Number(formData.workstation_id))?.workstation_name || ""}` : "Search workstation..."}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-600 bg-white"
              value={workstationSearchTerm}
              onChange={(e) => setWorkstationSearchTerm(e.target.value)}
              onFocus={() => setIsWorkstationDropdownOpen(true)}
              disabled={!!preselectedWorkstation}
              readOnly={!!preselectedWorkstation}
            />
            {!preselectedWorkstation && (
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setIsWorkstationDropdownOpen(!isWorkstationDropdownOpen)}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown Options */}
          {isWorkstationDropdownOpen && !preselectedWorkstation && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search workstations..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={workstationSearchTerm}
                    onChange={(e) => setWorkstationSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* Workstation Options */}
              {workstations
                .filter(
                  (ws) => !formData.lab_id || ws.lab_id === Number(formData.lab_id),
                )
                .filter((ws) =>
                  ws.workstation_name.toLowerCase().includes(workstationSearchTerm.toLowerCase())
                )
                .sort((a, b) => {
                  const nameA = a.workstation_name || "";
                  const nameB = b.workstation_name || "";
                  
                  // Extract numbers for proper numeric sorting
                  const numA = parseInt(nameA.replace(/\D+/g, "")) || 0;
                  const numB = parseInt(nameB.replace(/\D+/g, "")) || 0;
                  
                  // If both have numbers, compare numerically first
                  if (numA && numB) {
                    if (numA !== numB) {
                      return numA - numB;
                    }
                  }
                  
                  // If numbers are equal or one/both don't have numbers, compare alphabetically
                  return nameA.localeCompare(nameB);
                })
                .map((ws) => (
                  <div
                    key={ws.workstation_id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => {
                      handleChange({
                        target: {
                          name: "workstation_id",
                          value: ws.workstation_id.toString(),
                        },
                      } as React.ChangeEvent<HTMLSelectElement>);
                      setWorkstationSearchTerm(ws.workstation_name);
                      setIsWorkstationDropdownOpen(false);
                    }}
                  >
                    {ws.workstation_name}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Property Tag */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Property Tag
        </label>
        <input
          type="text"
          name="property_tag_no"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
          value={formData.property_tag_no}
          onChange={handleChange}
          placeholder="e.g. CIT-2024-001"
        />
      </div>

      {/* Serial Number */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Serial Number
        </label>
        <input
          type="text"
          name="serial_number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
          value={formData.serial_number}
          onChange={handleChange}
          placeholder="e.g. SN123456"
        />
      </div>

      {/* Purchase Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Purchase Date
        </label>
        <input
          type="date"
          name="date_of_purchase"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
          value={formData.date_of_purchase}
          onChange={handleChange}
        />
      </div>

      {/* Description */}
      <div className="md:col-span-2 lg:col-span-3">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
          rows={2}
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter details..."
        />
      </div>
    </div>

    {/* Add Unit Modal */}
    <AddUnitModal
      show={isAddUnitModalOpen}
      onClose={() => setIsAddUnitModalOpen(false)}
      onSuccess={handleAddUnit}
      deviceTypeId={Number(formData.device_type)}
      deviceTypeName={getCurrentDeviceType()?.device_type_name || ""}
    />
    </>
  );
};

export default AssetFormInputs;
