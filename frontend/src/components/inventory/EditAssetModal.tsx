//frontend/src/components/inventory/EditAssetModal.tsx
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { getAssetStatuses } from "../../api/inventory";
import { createPortal } from "react-dom";

interface Props {
  show: boolean;
  asset: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAssetModal: React.FC<Props> = ({
  show,
  asset,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth(); // ✅ Get current user
  const [labs, setLabs] = useState<{ lab_id: number; lab_name: string }[]>([]);
  const [units, setUnits] = useState<{ unit_id: number; unit_name: string }[]>(
    [],
  );
  const [workstations, setWorkstations] = useState<
    { workstation_id: number; workstation_name: string }[]
  >([]);
  const [statuses, setStatuses] = useState<{ status_id: number; status_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    assetName: string;
    unitName: string;
    currentStatus: string;
    newStatus: string;
  } | null>(null);

  // Initialize form data
  const [formData, setFormData] = useState({
    property_tag_no: "",
    lab_id: "",
    unit_id: "",
    workstation_id: "",
    description: "",
    serial_number: "",
    quantity: 1,
    date_of_purchase: "",
    asset_remarks: "", // ✅ Added Remarks field
    status_id: "", // ✅ Added status field
  });

  useEffect(() => {
    if (show) {
      loadDropdowns();
      if (asset) {
        console.log('EditAssetModal - Asset data:', asset);
        console.log('Asset lab_id:', asset.lab_id);
        console.log('Asset laboratories:', asset.laboratories);
        // ✅ Map nested backend data to flat form state
        setFormData({
          property_tag_no:
            asset.asset_details?.property_tag_no || asset.property_tag_no || "",
          description: asset.asset_details?.description || asset.description || "",
          serial_number:
            asset.asset_details?.serial_number || asset.serial_number || "",
          quantity: asset.asset_details?.quantity || asset.quantity || 1,
          date_of_purchase: asset.asset_details?.date_of_purchase
            ? new Date(asset.asset_details.date_of_purchase)
                .toISOString()
                .split("T")[0]
            : "",
          asset_remarks: asset.asset_details?.asset_remarks || "", // ✅ Map remarks
          status_id: asset.asset_details?.status_id?.toString() || "", // ✅ Map status

          // ID References - try multiple ways to get lab_id
          lab_id: asset.lab_id?.toString() || asset.laboratories?.lab_id?.toString() || "",
          unit_id: asset.unit_id?.toString() || "",
          workstation_id: asset.workstation_id?.toString() || "",
        });
        console.log('Set lab_id to:', asset.lab_id?.toString() || asset.laboratories?.lab_id?.toString() || "");
      }
    }
  }, [show, asset]);

  // Add ESC key support
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && show) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [show, onClose]);

  const loadDropdowns = async () => {
    try {
      const [labsRes, unitsRes, wsRes, statusesRes] = await Promise.all([
        api.get("/laboratories"),
        api.get("/inventory/units"),
        api.get("/workstations"),
        getAssetStatuses(),
      ]);
      setLabs(labsRes.data);
      setUnits(unitsRes.data);
      setWorkstations(wsRes.data);
      setStatuses(statusesRes);
    } catch (error) {
      console.error("Failed to load dropdowns", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get current and new status names for confirmation
    const currentStatus = statuses.find(s => s.status_id === Number(asset.asset_details?.status_id))?.status_name || "Unknown";
    const newStatus = statuses.find(s => s.status_id === Number(formData.status_id))?.status_name || "Unknown";
    const assetName = formData.description || formData.property_tag_no || "this asset";
    const unitName = units.find(u => u.unit_id === Number(formData.unit_id))?.unit_name || "Unknown Unit";
    
    // Set confirmation data and show modal
    setConfirmData({
      assetName,
      unitName,
      currentStatus,
      newStatus,
    });
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      // The backend expects specific fields to update the relations
      await api.put(`/inventory/${asset.asset_id}`, {
        ...formData,
        // Ensure IDs are sent as numbers or null, but don't send empty strings
        lab_id: formData.lab_id ? Number(formData.lab_id) : null,
        unit_id: formData.unit_id ? Number(formData.unit_id) : null,
        workstation_id: formData.workstation_id
          ? Number(formData.workstation_id)
          : null,
        status_id: formData.status_id ? Number(formData.status_id) : null,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update asset.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return createPortal(
    <>
      <div 
        className="fixed inset-0 backdrop-blur-md bg-black/20 z-[9999]"
        onClick={onClose}
      ></div>
      <div 
        className="fixed inset-0 z-[10000] overflow-y-auto"
        onClick={onClose}
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="p-6 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Asset</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Property Tag */}
              <div>
                <label className="block text-sm font-medium">Property Tag</label>
                <input
                  className="w-full border p-2 rounded"
                  value={formData.property_tag_no}
                  onChange={(e) =>
                    setFormData({ ...formData, property_tag_no: e.target.value })
                  }
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  className="w-full border p-2 rounded"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium">Serial Number</label>
                <input
                  className="w-full border p-2 rounded"
                  value={formData.serial_number}
                  onChange={(e) =>
                    setFormData({ ...formData, serial_number: e.target.value })
                  }
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  className="w-full border p-2 rounded"
                  value={formData.status_id}
                  onChange={(e) =>
                    setFormData({ ...formData, status_id: e.target.value })
                  }
                >
                  <option value="">Select Status</option>
                  {statuses.map((status) => (
                    <option key={status.status_id} value={status.status_id}>
                      {status.status_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date of Purchase */}
              <div>
                <label className="block text-sm font-medium">Date of Purchase</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded"
                  value={formData.date_of_purchase}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_purchase: e.target.value })
                  }
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium">Unit</label>
                <select
                  className="w-full border p-2 rounded"
                  value={formData.unit_id}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_id: e.target.value })
                  }
                >
                  <option value="">None</option>
                  {units.map((unit) => (
                    <option key={unit.unit_id} value={unit.unit_id}>
                      {unit.unit_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location (Lab) - LOCKED for Custodians */}
              <div>
                <label className="block text-sm font-medium">Laboratory</label>
                <select
                  className={`w-full border p-2 rounded ${
                    user?.role === "Custodian"
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  value={formData.lab_id}
                  disabled={user?.role === "Custodian"}
                  onChange={(e) =>
                    setFormData({ ...formData, lab_id: e.target.value })
                  }
                >
                  <option value="">None</option>
                  {labs.map((lab) => (
                    <option key={lab.lab_id} value={lab.lab_id}>
                      {lab.lab_name}
                    </option>
                  ))}
                </select>
                {user?.role === "Custodian" && (
                  <p className="text-xs text-gray-500 mt-1">
                    LOCKED: You can only edit assets within your assigned laboratory.
                  </p>
                )}
              </div>

              {/* Remarks - NEW FIELD */}
              <div>
                <label className="block text-sm font-medium">Remarks</label>
                <textarea
                  className="w-full border p-2 rounded"
                  rows={2}
                  placeholder="Add remarks (e.g., condition notes)"
                  value={formData.asset_remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, asset_remarks: e.target.value })
                  }
                />
              </div>
            </form>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors cursor-pointer"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmData && (
        <>
          <div 
            className="fixed inset-0 backdrop-blur-md bg-black/20 z-[10001]"
            onClick={() => setShowConfirmModal(false)}
          ></div>
          <div 
            className="fixed inset-0 z-[10002] overflow-y-auto"
            onClick={() => setShowConfirmModal(false)}
          >
            <div className="flex items-center justify-center min-h-screen px-4">
              <div 
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Confirm Status Change</h3>
                    <p className="text-sm text-gray-600">Please review the asset details before confirming</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Asset:</span>
                      <span className="text-sm font-semibold text-gray-900">{confirmData.assetName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Unit:</span>
                      <span className="text-sm font-semibold text-gray-900">{confirmData.unitName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Current Status:</span>
                      <span className="text-sm font-semibold text-gray-900">{confirmData.currentStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">New Status:</span>
                      <span className="text-sm font-semibold text-blue-600">{confirmData.newStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors cursor-pointer"
                  >
                    Confirm Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </>
    , document.body);
};

export default EditAssetModal;
