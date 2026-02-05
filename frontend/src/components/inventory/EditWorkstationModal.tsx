//frontend/src/components/inventory/EditWorkstationModal.tsx
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface Props {
  show: boolean;
  workstation: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EditWorkstationModal: React.FC<Props> = ({
  show,
  workstation,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [labs, setLabs] = useState<{ lab_id: number; lab_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    workstation_name: "",
    lab_id: "",
    workstation_remarks: "", // ✅ 1. Added Remarks State
  });

  useEffect(() => {
    if (show && workstation) {
      // ✅ 2. Load existing remarks
      setFormData({
        workstation_name: workstation.workstation_name || "",
        lab_id: workstation.lab_id?.toString() || "",
        workstation_remarks: workstation.workstation_remarks || "",
      });

      // Load labs
      const fetchLabs = async () => {
        try {
          const labRes = await api.get("/laboratories");
          setLabs(labRes.data);
        } catch (err) {
          console.error("Failed to load laboratories", err);
        }
      };
      fetchLabs();
    }
  }, [show, workstation]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submissionData = {
        ...formData,
        lab_id: formData.lab_id ? parseInt(formData.lab_id) : null,
      };

      await api.put(
        `/workstations/${workstation.workstation_id}`,
        submissionData,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update workstation.");
    } finally {
      setLoading(false);
    }
  };

  if (!show || !workstation) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Workstation</h3>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors"
                onClick={onClose}
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

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Workstation Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workstation Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="workstation_name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.workstation_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Laboratory Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Laboratory <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="lab_id"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        user?.role === "Custodian"
                          ? "bg-gray-100 cursor-not-allowed text-gray-500"
                          : ""
                      }`}
                      value={formData.lab_id}
                      onChange={handleChange}
                      required
                      disabled={user?.role === "Custodian"}
                    >
                      <option value="">Select Laboratory...</option>
                      {labs.map((lab) => (
                        <option key={lab.lab_id} value={lab.lab_id}>
                          {lab.lab_name}
                        </option>
                      ))}
                    </select>
                    {user?.role === "Custodian" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Locked to your assigned lab.
                      </p>
                    )}
                  </div>

                  {/* ✅ 3. Remarks Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      name="workstation_remarks"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Enter notes (e.g., specific location in room, condition issues)"
                      value={formData.workstation_remarks}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex items-center justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Workstation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditWorkstationModal;
