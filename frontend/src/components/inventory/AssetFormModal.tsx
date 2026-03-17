//frontend/src/component/inventory/AssetFormModal.tsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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

  // Add ESC key support
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

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
        <div className="flex items-center justify-center min-h-screen px-4 py-6">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between shadow-md z-10">
              <h3 className="text-lg font-semibold">Add New Inventory Asset</h3>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-blue-700"
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

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="item_name"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Tag No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="property_tag_no"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Laboratory</label>
                  <select
                    name="lab_id"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                  >
                    <option value="">Select Lab...</option>
                    <option value="1">Computer Lab 1</option>
                    <option value="2">Biology Lab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                  <select
                    name="unit_id"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                  >
                    <option value="">Select Unit...</option>
                    <option value="1">System Unit</option>
                    <option value="2">Monitor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    name="serial_number"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Purchase</label>
                  <input
                    type="date"
                    name="date_of_purchase"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    name="supplier_name"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            </form>

            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium shadow-md transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Save Asset
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
    , document.body);
};

export default AssetFormModal;
