//frontend/src/component/inventory/AssetFormModal.tsx
import React, { useState } from "react";

interface ModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const AssetFormModal: React.FC<ModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    item_name: "",
    property_tag_no: "",
    lab_id: "",
    unit_id: "",
    quantity: 1,
    description: "",
    serial_number: "",
    supplier_name: "",
    date_of_purchase: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_name || !formData.property_tag_no) {
      alert("Please fill required fields");
      return;
    }
    onSave(formData);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Add New Inventory Asset</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                {/* Required Fields Group */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Item Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="item_name"
                    className="form-control"
                    required
                    onChange={handleChange}
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
                    required
                    onChange={handleChange}
                  />
                </div>

                {/* Dropdowns (Prisma Relations) */}
                <div className="col-md-6">
                  <label className="form-label">Laboratory</label>
                  <select
                    name="lab_id"
                    className="form-select"
                    onChange={handleChange}
                  >
                    <option value="">Select Lab...</option>
                    <option value="1">Computer Lab 1</option>
                    <option value="2">Biology Lab</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Unit Type</label>
                  <select
                    name="unit_id"
                    className="form-select"
                    onChange={handleChange}
                  >
                    <option value="">Select Unit...</option>
                    <option value="1">System Unit</option>
                    <option value="2">Monitor</option>
                  </select>
                </div>

                {/* Details */}
                <div className="col-md-4">
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    name="serial_number"
                    className="form-control"
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    className="form-control"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Date of Purchase</label>
                  <input
                    type="date"
                    name="date_of_purchase"
                    className="form-control"
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Supplier Name</label>
                  <input
                    type="text"
                    name="supplier_name"
                    className="form-control"
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows={3}
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
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-save me-1"></i> Save Asset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssetFormModal;
