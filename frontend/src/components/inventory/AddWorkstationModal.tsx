import React, { useState, useEffect } from "react";
import api from "../../api/axios";

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddWorkstationModal: React.FC<Props> = ({ show, onClose, onSuccess }) => {
  const [labs, setLabs] = useState<{ lab_id: number; lab_name: string }[]>([]);
  const [name, setName] = useState("");
  const [labId, setLabId] = useState("");
  const [loading, setLoading] = useState(false);

  // Load Labs for the dropdown
  useEffect(() => {
    if (show) {
      api.get("/laboratories").then((res) => setLabs(res.data));
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/workstations", {
        workstation_name: name,
        lab_id: labId,
      });
      alert("Workstation Created!");
      onSuccess();
      onClose();
      setName("");
      setLabId("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create workstation");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-dark text-white">
              <h5 className="modal-title">Create Workstation</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Workstation Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. WS-PC1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Location (Lab)</label>
                  <select
                    className="form-select"
                    value={labId}
                    onChange={(e) => setLabId(e.target.value)}
                    required
                  >
                    <option value="">Select Lab...</option>
                    {labs.map((lab) => (
                      <option key={lab.lab_id} value={lab.lab_id}>
                        {lab.lab_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddWorkstationModal;
