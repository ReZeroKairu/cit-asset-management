// frontend/src/components/AddAssetModal.tsx
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Added device_type_id to the Unit interface for filtering
interface Unit {
  unit_id: number;
  unit_name: string;
  device_type_id: number;
}

interface AssetEntry {
  id: string;
  property_tag_no: string;
  quantity: number;
  description: string;
  serial_number: string;
  date_of_purchase: string;
  unit_id: number;
  unit_name: string;
  device_type: string;
  lab_id: number;
  lab_name: string;
  workstation_id?: number;
  workstation_name?: string;
}

const AddAssetModal: React.FC<Props> = ({ show, onClose, onSuccess }) => {
  const { user } = useAuth();

  // 1. Defined State
  const [workstations, setWorkstations] = useState<any[]>([]);
  const [labs, setLabs] = useState<
    {
      lab_id: number;
      lab_name: string;
      in_charge_id?: number;
      in_charge_name?: string;
    }[]
  >([]);

  // Updated State: units now stores the device_type_id
  const [units, setUnits] = useState<Unit[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<
    { device_type_id: number; device_type_name: string }[]
  >([]);

  // Form State
  const [formData, setFormData] = useState({
    property_tag_no: "",
    quantity: 1,
    description: "",
    serial_number: "",
    date_of_purchase: "",
    unit_id: "",
    device_type: "",
    lab_id: "",
    workstation_id: "",
  });

  // List State
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 2. Load Labs and auto-select for custodians
  useEffect(() => {
    if (show) {
      api
        .get("/laboratories")
        .then((res) => {
          setLabs(res.data);
          // Auto-select lab for custodians after labs are loaded
          if (user && user.role === "Custodian" && user.lab_id) {
            setFormData((prev) => ({
              ...prev,
              lab_id: user.lab_id.toString(),
            }));
          }
        })
        .catch((err) => console.error("Failed to load labs", err));
    }
  }, [show, user]);

  // 3. Consolidated Data Loading (Device Types, Workstations, AND Units)
  useEffect(() => {
    if (show) {
      const fetchData = async () => {
        try {
          // We fetch ALL units here once. Filtering happens in the UI.
          const [deviceTypeRes, wsRes, unitRes] = await Promise.all([
            api.get("/device-types"),
            api.get("/workstations"),
            api.get("/units"),
          ]);
          setDeviceTypes(deviceTypeRes.data);
          setWorkstations(wsRes.data);
          setUnits(unitRes.data);
        } catch (err) {
          console.error("Failed to load dropdowns", err);
        }
      };
      fetchData();
    }
  }, [show]);

  // 4. Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setFormData({
        property_tag_no: "",
        quantity: 1,
        description: "",
        serial_number: "",
        date_of_purchase: "",
        unit_id: "",
        device_type: "",
        lab_id: "",
        workstation_id: "",
      });
    }
  }, [show]);

  // Updated handleChange with Logic to Reset Unit
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // LOGIC: If Device Type changes, clear the Unit selection
      if (name === "device_type") {
        newData.unit_id = "";
      }

      return newData;
    });
  };

  const handleAddToList = () => {
    // --- FAILSAFE LOGIC FOR LAB SELECTION ---
    let targetLabId: number | null = null;

    if (user?.role === "Custodian" && user.lab_id) {
      targetLabId = user.lab_id;
    } else {
      targetLabId = formData.lab_id ? Number(formData.lab_id) : null;
    }

    if (!targetLabId) {
      alert("Please select a lab first.");
      return;
    }

    // Validate required fields
    if (!formData.unit_id) {
      alert("Please select a unit.");
      return;
    }

    if (!formData.device_type) {
      alert("Please select a device type.");
      return;
    }
    // -------------------------------------

    // Check for duplicates in the CURRENT list
    const unit = units.find((u) => u.unit_id === Number(formData.unit_id));
    const deviceType = deviceTypes.find(
      (dt) => dt.device_type_id === Number(formData.device_type),
    );
    const lab = labs.find((l) => l.lab_id === targetLabId);
    const workstation = formData.workstation_id
      ? workstations.find(
          (ws) => ws.workstation_id === Number(formData.workstation_id),
        )
      : null;

    const isDuplicate = assets.some(
      (asset) =>
        asset.unit_name === unit?.unit_name && asset.lab_id === targetLabId,
    );

    if (isDuplicate) {
      alert("This asset is already in your list below.");
      return;
    }

    const newAsset: AssetEntry = {
      id: Date.now().toString(),
      property_tag_no: formData.property_tag_no.trim(),
      quantity: Number(formData.quantity),
      description: formData.description.trim(),
      serial_number: formData.serial_number.trim(),
      date_of_purchase: formData.date_of_purchase,
      unit_id: Number(formData.unit_id),
      unit_name: unit?.unit_name || `Unit ID: ${formData.unit_id}`,
      device_type:
        deviceType?.device_type_name || `Device Type: ${formData.device_type}`,
      lab_id: targetLabId,
      lab_name: lab?.lab_name || `Lab ID: ${targetLabId}`,
      workstation_id: formData.workstation_id
        ? Number(formData.workstation_id)
        : undefined,
      workstation_name: workstation?.workstation_name || undefined,
    };

    setAssets([...assets, newAsset]);

    // Clear form for next entry (except lab selection)
    setFormData((prev) => ({
      ...prev,
      property_tag_no: "",
      quantity: 1,
      description: "",
      serial_number: "",
      date_of_purchase: "",
      unit_id: "",
      device_type: "",
      workstation_id: "",
    }));
  };

  const handleRemoveFromList = (id: string) => {
    setAssets(assets.filter((asset) => asset.id !== id));
  };

  const handleSaveAll = async () => {
    if (assets.length === 0) return;

    // Validate that all assets have required fields
    const invalidAssets = assets.filter(
      (asset) => !asset.unit_id || !asset.lab_id,
    );

    if (invalidAssets.length > 0) {
      alert(
        "Some assets are missing required fields (Unit or Lab). Please review the list.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = assets.map((asset) => ({
        property_tag_no: asset.property_tag_no || null,
        quantity: asset.quantity,
        description: asset.description,
        serial_number: asset.serial_number,
        date_of_purchase: asset.date_of_purchase,
        unit_id: asset.unit_id,
        lab_id: asset.lab_id,
        workstation_id: asset.workstation_id || null,
      }));

      // --- DEBUGGING LOGS START ---
      console.log(
        "🚀 Debug: Submitting Assets Payload:",
        JSON.stringify(payload, null, 2),
      );
      // --- DEBUGGING LOGS END ---

      await api.post("/inventory/batch", { assets: payload });

      alert(`Successfully saved ${assets.length} asset(s)!`);
      handleClose();
      onSuccess();
    } catch (err: any) {
      // --- DEBUGGING LOGS START ---
      console.error("❌ Debug: Save Error Object:", err);
      if (err.response) {
        console.error("❌ Debug: Server Response Data:", err.response.data);
        console.error("❌ Debug: Status Code:", err.response.status);
      }
      // --- DEBUGGING LOGS END ---

      if (err.response?.data?.details) {
        alert(`Validation Error: ${err.response.data.details.join(", ")}`);
      } else {
        alert(
          err.response?.data?.error ||
            "Failed to save assets. Please check all required fields.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setAssets([]);
    setFormData({
      property_tag_no: "",
      quantity: 1,
      description: "",
      serial_number: "",
      date_of_purchase: "",
      unit_id: "",
      device_type: "",
      lab_id: "",
      workstation_id: "",
    });
    onClose();
  };

  // --- FILTER LOGIC ---
  const filteredUnits = units.filter(
    (unit) => unit.device_type_id === Number(formData.device_type),
  );

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Assets</h3>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors"
                onClick={handleClose}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Form Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded border">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="device_type"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
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

                {/* --- UPDATED UNIT NAME DROPDOWN --- */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="unit_id"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
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
                {/* ---------------------------------- */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Tag Number
                  </label>
                  <input
                    type="text"
                    name="property_tag_no"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. CIT-2024-001"
                    value={formData.property_tag_no}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. SN123456789"
                    value={formData.serial_number}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Purchase
                  </label>
                  <input
                    type="date"
                    name="date_of_purchase"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    value={formData.date_of_purchase}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Laboratory <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="lab_id"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-600"
                    value={formData.lab_id}
                    onChange={handleChange}
                    disabled={user?.role === "Custodian"}
                  >
                    <option value="">Select Lab...</option>
                    {labs.map((lab) => (
                      <option key={lab.lab_id} value={lab.lab_id}>
                        {lab.lab_name}{" "}
                        {lab.in_charge_id
                          ? `(Manager: ID ${lab.in_charge_id})`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {user?.role === "Custodian" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Locked to your assigned lab.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workstation{" "}
                    <span className="text-xs text-gray-500">(Optional)</span>
                  </label>
                  <select
                    name="workstation_id"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    value={formData.workstation_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Workstation...</option>
                    {workstations
                      .filter(
                        (ws) =>
                          !formData.lab_id ||
                          ws.lab_id === Number(formData.lab_id),
                      )
                      .sort((a, b) =>
                        a.workstation_name.localeCompare(b.workstation_name),
                      )
                      .map((ws) => (
                        <option
                          key={ws.workstation_id}
                          value={ws.workstation_id}
                        >
                          {ws.workstation_name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter asset description..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handleAddToList}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium shadow-sm"
                >
                  + Add to List
                </button>
              </div>

              {/* List Table */}
              <div className="border rounded overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b font-medium text-sm flex justify-between items-center">
                  <span>Pending Assets ({assets.length})</span>
                  {assets.length > 0 && (
                    <span className="text-xs text-blue-600">
                      Click "Save All" to finish!
                    </span>
                  )}
                </div>

                {assets.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No assets added yet. Use the form above to add them to this
                    list.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 sticky top-0">
                        <tr>
                          <th className="px-4 py-2">Unit Name</th>
                          <th className="px-4 py-2">Property Tag</th>
                          <th className="px-4 py-2">Qty</th>
                          <th className="px-4 py-2">Device Type</th>
                          <th className="px-4 py-2">Workstation</th>
                          <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {assets.map((asset) => (
                          <tr key={asset.id}>
                            <td className="px-4 py-2 font-medium">
                              {asset.unit_name}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {asset.property_tag_no || "-"}
                            </td>
                            <td className="px-4 py-2">{asset.quantity}</td>
                            <td className="px-4 py-2 text-gray-500">
                              {asset.device_type}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {asset.workstation_name || "None"}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => handleRemoveFromList(asset.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                disabled={submitting || assets.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm"
              >
                {submitting ? "Saving..." : "Save All to Database"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddAssetModal;
