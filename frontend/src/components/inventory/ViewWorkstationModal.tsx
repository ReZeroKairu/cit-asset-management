// frontend/src/components/inventory/ViewWorkstationModal.tsx
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import EditAssetModal from "./EditAssetModal";
import AddAssetModal from "./AddAssetModal";

interface Props {
  show: boolean;
  workstation: any;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to determine status color
const getStatusColor = (statusName?: string) => {
  switch (statusName) {
    case "Functional":
      return "bg-green-100 text-green-800";
    case "For Repair":
      return "bg-yellow-100 text-yellow-800";
    case "For Replacement":
      return "bg-red-100 text-red-800";
    case "For Upgrade":
      return "bg-blue-100 text-blue-800";
    case "Disposed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ViewWorkstationModal: React.FC<Props> = ({
  show,
  workstation,
  onClose,
  onSuccess,
}) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && workstation) {
      fetchWorkstationAssets();
    }
  }, [show, workstation]);

  const fetchWorkstationAssets = async () => {
    try {
      setLoading(true);
      // This endpoint calls getInventory which includes details.current_status
      const res = await api.get(
        `/inventory?workstation_id=${workstation.workstation_id}`,
      );
      setAssets(res.data);
    } catch (err) {
      console.error("❌ Error fetching workstation assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAsset = (asset: any) => {
    setEditingAsset(asset);
    setShowEditModal(true);
  };

  const handleDeleteAsset = async (assetId: number) => {
    if (!confirm("Are you sure you want to remove this asset?")) {
      return;
    }

    try {
      await api.delete(`/inventory/${assetId}`);
      await fetchWorkstationAssets();
      onSuccess();
    } catch (err: any) {
      console.error("Failed to delete asset:", err);
      alert(err.response?.data?.error || "Failed to delete asset");
    }
  };

  const handleAssetModalSuccess = () => {
    setShowEditModal(false);
    setEditingAsset(null);
    setShowAddModal(false);
    fetchWorkstationAssets(); // Refresh the table immediately
    onSuccess();
  };

  if (!show || !workstation) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold">
                  {workstation.workstation_name}
                </h3>
                <p className="text-blue-100 text-sm">
                  {workstation.laboratory?.lab_name || "No Laboratory"}
                </p>
              </div>
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

            {/* Workstation Info Summary */}
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Laboratory
                  </h4>
                  <p className="text-gray-900 font-medium">
                    {workstation.laboratory?.lab_name || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Location
                  </h4>
                  <p className="text-gray-900 font-medium">
                    {workstation.laboratory?.location || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Assets
                  </h4>
                  <p className="text-gray-900 font-medium">
                    {assets.length} items
                  </p>
                </div>
              </div>
            </div>

            {/* Assets Table Section */}
            <div className="p-6 flex-1 overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  Assigned Assets
                </h4>
                <button
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center shadow-sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <svg
                    className="w-4 h-4 mr-1"
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
                  Add Asset
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">
                    No assets assigned to this workstation.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Property Tag
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Unit Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Serial Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Remarks
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assets.map((asset) => (
                        <tr
                          key={asset.asset_id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {asset.details?.property_tag_no ||
                              asset.property_tag_no ||
                              "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asset.units?.unit_name || asset.unit_name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {asset.details?.serial_number ||
                              asset.serial_number ||
                              "-"}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate"
                            title={asset.details?.description}
                          >
                            {asset.details?.description ||
                              asset.description ||
                              "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.details?.current_status?.status_name)}`}
                            >
                              {asset.details?.current_status?.status_name ||
                                "Unknown"}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-500 max-w-[150px] truncate"
                            title={asset.details?.asset_remarks}
                          >
                            {asset.details?.asset_remarks || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEditAsset(asset)}
                                className="text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 p-2 rounded-full transition-colors"
                                title="Edit Asset Details"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteAsset(asset.asset_id)
                                }
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors"
                                title="Remove Asset"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <EditAssetModal
        show={showEditModal}
        asset={editingAsset}
        onClose={() => {
          setShowEditModal(false);
          setEditingAsset(null);
        }}
        onSuccess={handleAssetModalSuccess}
      />

      {/* ✅ PASS PRESELECTED WORKSTATION HERE */}
      <AddAssetModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAssetModalSuccess}
        preselectedWorkstation={workstation} // <--- Passed prop
      />
    </>
  );
};

export default ViewWorkstationModal;
