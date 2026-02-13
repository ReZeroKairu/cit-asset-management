import React, { useState, useEffect } from "react";
import {
  getDeviceTypes,
  getUnits,
  batchCreateAssets,
} from "../../api/inventory";
import { getAllWorkstations } from "../../api/workstations";
import { getLaboratories } from "../../api/laboratories";
import { useAuth } from "../../context/AuthContext";

// Import our new sub-components
import AssetFormInputs from "./add-asset/AssetFormInputs";
import PendingAssetsTable from "./add-asset/PendingAssetsTable";

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedWorkstation?: any;
}

interface Unit {
  unit_id: number;
  unit_name: string;
  device_type_id: number;
}

export interface AssetEntry {
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

const AddAssetModal: React.FC<Props> = ({
  show,
  onClose,
  onSuccess,
  preselectedWorkstation,
}) => {
  const { user } = useAuth();

  const [workstations, setWorkstations] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);

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

  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 1. Data Loading
  useEffect(() => {
    if (show) {
      const fetchData = async () => {
        try {
          const [deviceTypeData, wsData, unitData, labData] = await Promise.all(
            [
              getDeviceTypes(),
              getAllWorkstations(),
              getUnits(),
              getLaboratories(),
            ],
          );
          setDeviceTypes(deviceTypeData);
          setWorkstations(wsData);
          setUnits(unitData);
          setLabs(labData);
        } catch (err) {
          console.error("Failed to load dropdowns", err);
        }
      };
      fetchData();
    }
  }, [show]);

  // 2. Handle Pre-selection
  useEffect(() => {
    if (show) {
      if (preselectedWorkstation) {
        setFormData((prev) => ({
          ...prev,
          lab_id: preselectedWorkstation.lab_id?.toString() || "",
          workstation_id:
            preselectedWorkstation.workstation_id?.toString() || "",
        }));
      } else if (user && user.role === "Custodian" && user.lab_id) {
        setFormData((prev) => ({
          ...prev,
          lab_id: user.lab_id?.toString() || "",
        }));
      }
    }
  }, [show, user, preselectedWorkstation]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "device_type") newData.unit_id = ""; // Reset unit when device type changes
      if (name === "lab_id") newData.workstation_id = ""; // Reset workstation when lab changes
      return newData;
    });
  };

  const handleAddToList = () => {
    let targetLabId: number | null = null;

    if (preselectedWorkstation) {
      targetLabId = preselectedWorkstation.lab_id;
    } else if (user?.role === "Custodian" && user.lab_id) {
      targetLabId = user.lab_id;
    } else {
      targetLabId = formData.lab_id ? Number(formData.lab_id) : null;
    }

    if (!targetLabId) {
      alert("Please select a lab first.");
      return;
    }

    if (!formData.unit_id || !formData.device_type) {
      alert("Please select a device type and unit.");
      return;
    }

    if (
      formData.property_tag_no.trim() !== "" &&
      assets.some((a) => a.property_tag_no === formData.property_tag_no.trim())
    ) {
      alert(
        `Property Tag "${formData.property_tag_no}" is already in your pending list!`,
      );
      return;
    }

    const unit = units.find((u) => u.unit_id === Number(formData.unit_id));
    const deviceType = deviceTypes.find(
      (dt) => dt.device_type_id === Number(formData.device_type),
    );
    const lab = labs.find((l) => l.lab_id === targetLabId);

    let workstationName: string | undefined = undefined;
    if (preselectedWorkstation) {
      workstationName = preselectedWorkstation.workstation_name;
    } else if (formData.workstation_id) {
      const ws = workstations.find(
        (w) => w.workstation_id === Number(formData.workstation_id),
      );
      workstationName = ws?.workstation_name;
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
      device_type: deviceType?.device_type_name || "",
      lab_id: targetLabId,
      lab_name: lab?.lab_name || `Lab ID: ${targetLabId}`,
      workstation_id: preselectedWorkstation
        ? preselectedWorkstation.workstation_id
        : formData.workstation_id
          ? Number(formData.workstation_id)
          : undefined,
      workstation_name: workstationName,
    };

    setAssets([...assets, newAsset]);

    // ✅ FIX: We no longer reset device_type, unit_id, lab_id, workstation_id, or description.
    // They are "frozen" to make batch adding much faster!
    setFormData((prev) => ({
      ...prev,
      property_tag_no: "",
      serial_number: "",
      quantity: 1,
    }));
  };

  const handleRemoveFromList = (id: string) => {
    setAssets(assets.filter((asset) => asset.id !== id));
  };

  const handleSaveAll = async () => {
    if (assets.length === 0) return;
    setSubmitting(true);
    try {
      const payload = assets.map((asset) => ({
        property_tag_no: asset.property_tag_no.trim() || null,
        quantity: asset.quantity,
        description: asset.description.trim() || null,
        serial_number: asset.serial_number.trim() || null,
        date_of_purchase: asset.date_of_purchase
          ? new Date(asset.date_of_purchase).toISOString()
          : null,
        unit_id: asset.unit_id,
        lab_id: asset.lab_id,
        workstation_id: asset.workstation_id || null,
      }));

      await batchCreateAssets(payload);

      alert(`Successfully saved ${assets.length} asset(s)!`);
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error("Save Error:", err);
      if (err.response?.data?.error?.includes("Unique constraint")) {
        alert(
          "Error: One of the Property Tag Numbers you entered already exists in the database.",
        );
      } else {
        alert(
          err.response?.data?.error ||
            "Failed to save assets. Please try again.",
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

  const filteredUnits = units.filter(
    (unit) => unit.device_type_id === Number(formData.device_type),
  );

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] transition-opacity"></div>
      <div className="fixed inset-0 z-[90] overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 py-6">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between shadow-md z-10">
              <h3 className="text-lg font-semibold tracking-wide">
                {preselectedWorkstation
                  ? `Add Assets to ${preselectedWorkstation.workstation_name}`
                  : "Create Assets"}
              </h3>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-blue-700"
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

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto">
              {/* Form Inputs Component */}
              <AssetFormInputs
                formData={formData}
                handleChange={handleChange}
                deviceTypes={deviceTypes}
                filteredUnits={filteredUnits}
                labs={labs}
                workstations={workstations}
                preselectedWorkstation={preselectedWorkstation}
                userRole={user?.role}
              />

              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handleAddToList}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-md transition-all active:scale-95"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add to List
                </button>
              </div>

              {/* Pending Assets Table Component */}
              <PendingAssetsTable
                assets={assets}
                onRemove={handleRemoveFromList}
              />
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                disabled={submitting || assets.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md transition-colors"
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
