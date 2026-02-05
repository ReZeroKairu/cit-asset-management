//frontend/src/components/inventory/EditAssetModal.tsx
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

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
  const [loading, setLoading] = useState(false);

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
  });

  useEffect(() => {
    if (show) {
      loadDropdowns();
      if (asset) {
        // ✅ Map nested backend data to flat form state
        setFormData({
          property_tag_no:
            asset.details?.property_tag_no || asset.property_tag_no || "",
          description: asset.details?.description || asset.description || "",
          serial_number:
            asset.details?.serial_number || asset.serial_number || "",
          quantity: asset.details?.quantity || asset.quantity || 1,
          date_of_purchase: asset.details?.date_of_purchase
            ? new Date(asset.details.date_of_purchase)
                .toISOString()
                .split("T")[0]
            : "",
          asset_remarks: asset.details?.asset_remarks || "", // ✅ Map remarks

          // ID References
          lab_id: asset.lab_id?.toString() || "",
          unit_id: asset.unit_id?.toString() || "",
          workstation_id: asset.workstation_id?.toString() || "",
        });
      }
    }
  }, [show, asset]);

  const loadDropdowns = async () => {
    try {
      const [labsRes, unitsRes, wsRes] = await Promise.all([
        api.get("/laboratories"),
        api.get("/units"),
        api.get("/workstations"),
      ]);
      setLabs(labsRes.data);
      setUnits(unitsRes.data);
      setWorkstations(wsRes.data);
    } catch (error) {
      console.error("Failed to load dropdowns", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // The backend expects specific fields to update the relations
      await api.put(`/inventory/${asset.asset_id}`, {
        ...formData,
        // Ensure IDs are sent as numbers or null
        lab_id: formData.lab_id ? Number(formData.lab_id) : null,
        unit_id: formData.unit_id ? Number(formData.unit_id) : null,
        workstation_id: formData.workstation_id
          ? Number(formData.workstation_id)
          : null,
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
              disabled={user?.role === "Custodian"} // ✅ Lock for custodians
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
                LOCKED: You can only edit assets within your assigned
                laboratory.
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

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssetModal;
