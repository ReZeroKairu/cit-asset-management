import React from "react";

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
}) => {
  return (
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
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Unit Name <span className="text-red-500">*</span>
        </label>
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
          Workstation{" "}
          <span className="text-xs font-normal text-gray-500">(Optional)</span>
        </label>
        <select
          name="workstation_id"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-600 bg-white"
          value={formData.workstation_id}
          onChange={handleChange}
          disabled={!!preselectedWorkstation}
        >
          <option value="">Select Workstation...</option>
          {workstations
            .filter(
              (ws) => !formData.lab_id || ws.lab_id === Number(formData.lab_id),
            )
            .sort((a, b) =>
              a.workstation_name.localeCompare(b.workstation_name),
            )
            .map((ws) => (
              <option key={ws.workstation_id} value={ws.workstation_id}>
                {ws.workstation_name}
              </option>
            ))}
        </select>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Quantity
        </label>
        <input
          type="number"
          name="quantity"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
          value={formData.quantity}
          onChange={handleChange}
          min="1"
        />
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
  );
};

export default AssetFormInputs;
