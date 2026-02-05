// frontend/src/components/inventory/AddWorkstationModal.tsx
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface WorkstationEntry {
  id: string;
  workstation_name: string;
  lab_id: number;
}

const AddWorkstationModal: React.FC<Props> = ({ show, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [labs, setLabs] = useState<
    { lab_id: number; lab_name: string; location?: string }[]
  >([]);

  // Form State
  const [name, setName] = useState("");
  const [selectedLabId, setSelectedLabId] = useState<number | string>("");

  // List State
  const [workstations, setWorkstations] = useState<WorkstationEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 1. Load Labs (Independent of User Selection)
  useEffect(() => {
    if (show) {
      api
        .get("/laboratories")
        .then((res) => {
          setLabs(res.data);
        })
        .catch((err) => console.error("Failed to load labs", err));
    }
  }, [show]);

  // 2. VISUAL SYNC: Update the dropdown visually if possible
  useEffect(() => {
    if (show && user?.role === "Custodian" && user.lab_id) {
      setSelectedLabId(user.lab_id);
    }
  }, [show, user]);

  const handleAddToList = () => {
    if (!name.trim()) {
      alert("Please enter a workstation name");
      return;
    }

    // --- THE FIX: FAILSAFE LOGIC ---
    // Instead of trusting only 'selectedLabId', we check the user profile directly.
    let targetLabId: number | null = null;

    if (user?.role === "Custodian" && user.lab_id) {
      // Option A: If Custodian, ALWAYS use their assigned ID
      targetLabId = user.lab_id;
    } else {
      // Option B: Otherwise, use what is selected in the dropdown
      targetLabId = selectedLabId ? Number(selectedLabId) : null;
    }

    // Validation
    if (!targetLabId) {
      alert("Please select a lab first.");
      return;
    }
    // -----------------------------

    // Check for duplicates in the CURRENT list
    const isDuplicate = workstations.some(
      (ws) =>
        ws.workstation_name.toLowerCase() === name.trim().toLowerCase() &&
        ws.lab_id === targetLabId,
    );

    if (isDuplicate) {
      alert("This workstation is already in your list below.");
      return;
    }

    const newWorkstation: WorkstationEntry = {
      id: Date.now().toString(),
      workstation_name: name.trim(),
      lab_id: targetLabId, // Use the calculated ID
    };

    setWorkstations([...workstations, newWorkstation]);
    setName(""); // Clear input for fast typing
  };

  const handleRemoveFromList = (id: string) => {
    setWorkstations(workstations.filter((ws) => ws.id !== id));
  };

  const handleSaveAll = async () => {
    if (workstations.length === 0) return;

    setSubmitting(true);
    try {
      const payload = workstations.map((ws) => ({
        workstation_name: ws.workstation_name,
        lab_id: ws.lab_id,
      }));

      await api.post("/workstations/batch", { workstations: payload });

      alert(`Successfully saved ${workstations.length} workstation(s)!`);
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.error?.includes("Unique constraint")) {
        alert(
          "Error: One of these workstation names already exists in this lab.",
        );
      } else {
        alert(err.response?.data?.error || "Failed to save workstations.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setWorkstations([]);
    setName("");
    setSelectedLabId("");
    onClose();
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gray-800 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-lg font-semibold">Create Workstations</h3>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Form Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded border">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workstation Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. WS-01"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddToList()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lab *
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-600"
                    value={selectedLabId}
                    onChange={(e) => setSelectedLabId(Number(e.target.value))}
                    disabled={user?.role === "Custodian"}
                  >
                    <option value="">Select Lab...</option>
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
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddToList}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center shadow-sm"
                  >
                    <span className="mr-2 font-bold">+</span> Add to List
                  </button>
                </div>
              </div>

              {/* List Table */}
              <div className="border rounded overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b font-medium text-sm flex justify-between items-center">
                  <span>Pending Workstations ({workstations.length})</span>
                  {workstations.length > 0 && (
                    <span className="text-xs text-blue-600">
                      Click "Save All" to finish!
                    </span>
                  )}
                </div>

                {workstations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No workstations added yet. Use the form above to add them to
                    this list.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 sticky top-0">
                        <tr>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">Lab</th>
                          <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {workstations.map((ws) => {
                          const lab = labs.find((l) => l.lab_id === ws.lab_id);
                          return (
                            <tr key={ws.id}>
                              <td className="px-4 py-2 font-medium">
                                {ws.workstation_name}
                              </td>
                              <td className="px-4 py-2 text-gray-500">
                                {lab?.lab_name || `Lab ID: ${ws.lab_id}`}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => handleRemoveFromList(ws.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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
                disabled={submitting || workstations.length === 0}
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

export default AddWorkstationModal;
