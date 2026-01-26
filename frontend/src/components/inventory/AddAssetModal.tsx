// frontend/src/components/AddAssetModal.tsx
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddAssetModal: React.FC<Props> = ({ show, onClose, onSuccess }) => {
  const { user } = useAuth();

  // 1. Defined State
  const [workstations, setWorkstations] = useState<any[]>([]); // Use 'any' or interface
  const [labs, setLabs] = useState<{ lab_id: number; lab_name: string }[]>([]);
  const [units, setUnits] = useState<{ unit_id: number; unit_name: string }[]>(
    [],
  );

  const [formData, setFormData] = useState({
    item_name: "",
    property_tag_no: "",
    lab_id: "",
    unit_id: "",
    workstation_id: "", // <--- FIX 2: Initialize this!
    description: "",
    serial_number: "",
    quantity: 1,
    date_of_purchase: "",
    supplier_name: "",
    user_id: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      const fetchData = async () => {
        try {
          // <--- FIX 1: Fetch Workstations here!
          const [labRes, unitRes, wsRes] = await Promise.all([
            api.get("/laboratories"),
            api.get("/units"),
            api.get("/workstations"), // Assuming you created this endpoint
          ]);

          setLabs(labRes.data);
          setUnits(unitRes.data);
          setWorkstations(wsRes.data); // Set the data
        } catch (err) {
          console.error("Failed to load dropdowns", err);
        }
      };
      fetchData();
    }
  }, [show]);

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

    const submissionData = {
      ...formData,
      user_id: user?.id,
      // Convert empty string to null for database
      workstation_id: formData.workstation_id
        ? parseInt(formData.workstation_id)
        : null,
    };

    try {
      await api.post("/inventory", submissionData);
      onSuccess();
      onClose();

      // Reset Form
      setFormData({
        item_name: "",
        property_tag_no: "",
        lab_id: "",
        unit_id: "",
        workstation_id: "",
        quantity: 1,
        description: "",
        serial_number: "",
        supplier_name: "",
        date_of_purchase: "",
        user_id: 0,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add asset.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Add New Asset</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="row g-3">
                  {/* ... (Keep your Name, Tag inputs same as before) ... */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Item Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="item_name"
                      className="form-control"
                      value={formData.item_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Property Tag No. <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="property_tag_no"
                      className="form-control"
                      value={formData.property_tag_no}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Dropdowns */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Location (Lab) <span className="text-danger">*</span>
                    </label>
                    <select
                      name="lab_id"
                      className="form-select"
                      value={formData.lab_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Laboratory...</option>
                      {labs.map((lab) => (
                        <option key={lab.lab_id} value={lab.lab_id}>
                          {lab.lab_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Unit Type <span className="text-danger">*</span>
                    </label>
                    <select
                      name="unit_id"
                      className="form-select"
                      value={formData.unit_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Unit Type...</option>
                      {units.length > 0 ? (
                        units.map((u) => (
                          <option key={u.unit_id} value={u.unit_id}>
                            {u.unit_name}
                          </option>
                        ))
                      ) : (
                        <option value="1">System Unit (Default)</option>
                      )}
                    </select>
                  </div>

                  {/* FIX 3: Workstation Dropdown with Controlled Value */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Assign to Workstation (Optional)
                    </label>
                    <select
                      name="workstation_id"
                      className="form-select"
                      value={formData.workstation_id} // <--- Controlled Component
                      onChange={handleChange}
                    >
                      <option value="">None (Loose Item)</option>
                      {workstations.map((ws: any) => (
                        <option
                          key={ws.workstation_id}
                          value={ws.workstation_id}
                        >
                          {ws.workstation_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ... (Keep Serial, Quantity, Date, Supplier, Description inputs same as before) ... */}
                  <div className="col-md-6">
                    <label className="form-label">Serial Number</label>
                    <input
                      type="text"
                      name="serial_number"
                      className="form-control"
                      value={formData.serial_number}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control"
                      value={formData.quantity}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date of Purchase</label>
                    <input
                      type="date"
                      name="date_of_purchase"
                      className="form-control"
                      value={formData.date_of_purchase}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Supplier Name</label>
                    <input
                      type="text"
                      name="supplier_name"
                      className="form-control"
                      value={formData.supplier_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows={2}
                      value={formData.description}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
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
                  {loading ? "Saving..." : "Save Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddAssetModal;
