import React, { useState, useEffect } from "react";
import api from "../../api/axios";

interface Props {
  show: boolean;
  asset: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAssetModal: React.FC<Props> = ({ show, asset, onClose, onSuccess }) => {
  const [workstations, setWorkstations] = useState<any[]>([]);
  const [labs, setLabs] = useState<{ lab_id: number; lab_name: string }[]>([]);
  const [units, setUnits] = useState<{ unit_id: number; unit_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    item_name: "",
    property_tag_no: "",
    lab_id: "",
    unit_id: "",
    workstation_id: "",
    description: "",
    serial_number: "",
    quantity: 1,
    date_of_purchase: "",
    supplier_name: "",
  });

  useEffect(() => {
    if (show && asset) {
      // Set form data from asset
      setFormData({
        item_name: asset.item_name || "",
        property_tag_no: asset.property_tag_no || "",
        lab_id: asset.laboratories?.lab_id?.toString() || "",
        unit_id: asset.units?.unit_id?.toString() || "",
        workstation_id: asset.workstation?.workstation_id?.toString() || "",
        description: asset.description || "",
        serial_number: asset.serial_number || "",
        quantity: asset.quantity || 1,
        date_of_purchase: asset.date_of_purchase ? new Date(asset.date_of_purchase).toISOString().split('T')[0] : "",
        supplier_name: asset.supplier_name || "",
      });

      // Load dropdown data
      const fetchData = async () => {
        try {
          const [labRes, unitRes, wsRes] = await Promise.all([
            api.get("/laboratories"),
            api.get("/units"),
            api.get("/workstations"),
          ]);

          setLabs(labRes.data);
          setUnits(unitRes.data);
          setWorkstations(wsRes.data);
        } catch (err) {
          console.error("Failed to load dropdowns", err);
        }
      };
      fetchData();
    }
  }, [show, asset]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
        workstation_id: formData.workstation_id ? parseInt(formData.workstation_id) : null,
        lab_id: formData.lab_id ? parseInt(formData.lab_id) : null,
        unit_id: formData.unit_id ? parseInt(formData.unit_id) : null,
        quantity: parseInt(formData.quantity.toString()),
      };

      await api.put(`/inventory/${asset.asset_id}`, submissionData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update asset.");
    } finally {
      setLoading(false);
    }
  };

  if (!show || !asset) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Asset</h3>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors"
                onClick={onClose}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="item_name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.item_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Tag No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="property_tag_no"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.property_tag_no}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location (Lab) <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="lab_id"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="unit_id"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign to Workstation
                    </label>
                    <select
                      name="workstation_id"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.workstation_id}
                      onChange={handleChange}
                    >
                      <option value="">None (Loose Item)</option>
                      {workstations.map((ws: any) => (
                        <option
                          key={ws.workstation_id}
                          value={ws.workstation_id}
                        >
                          {ws.workstation_name} - {ws.laboratory?.lab_name || 'No Lab'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      name="serial_number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.serial_number}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.quantity}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.date_of_purchase}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      name="supplier_name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.supplier_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      value={formData.description}
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
                  {loading ? "Updating..." : "Update Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditAssetModal;
