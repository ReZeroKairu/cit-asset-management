// frontend/src/components/inventory/ViewWorkstationModal.tsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, Edit, CheckSquare, Square } from "lucide-react";
import api from "../../api/axios";
import { updateAsset, getAssetStatuses } from "../../api/inventory";
import EditAssetModal from "./EditAssetModal";
import AddAssetModal from "./AddAssetModal";

interface Props {
  show: boolean;
  workstation: any;
  onClose: () => void;
  onSuccess?: () => void; // Make optional since we're not using it
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
  // onSuccess is optional and not used
}) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);

  useEffect(() => {
    if (show && workstation) {
      fetchWorkstationAssets();
    }
  }, [show, workstation]);

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
    if (!confirm("Are you sure you want to mark this asset as disposed? This will change its status to 'Disposed'.")) {
      return;
    }

    try {
      // Get asset statuses to find the "Disposed" status ID
      const statuses = await getAssetStatuses();
      const disposedStatus = statuses.find((status: any) => status.status_name === "Disposed");
      
      if (!disposedStatus) {
        alert("Disposed status not found in system");
        return;
      }

      // Update asset status to "Disposed"
      await updateAsset(assetId, {
        status_id: disposedStatus.status_id
      });
      
      // Remove the asset from local state (since it's now disposed)
      setAssets(prev => prev.filter(asset => asset.asset_id !== assetId));
      
      alert("Asset status changed to Disposed");
      
    } catch (err: any) {
      console.error("Failed to update asset status:", err);
      
      if (err.response?.status === 401) {
        alert("Your session has expired. Please log in again and try.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      
      alert(err.response?.data?.error || "Failed to update asset status");
    }
  };

  const handleAssetModalSuccess = () => {
    setShowEditModal(false);
    setEditingAsset(null);
    setShowAddModal(false);
    fetchWorkstationAssets(); // Refresh the table immediately
    
    // Don't call onSuccess() here as it closes the ViewWorkstationModal
    // The parent data will be refreshed when user closes the modal
  };

  const handleAssetSelection = (assetId: number) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === assets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(assets.map(asset => asset.asset_id));
    }
  };

  const handleBulkDispose = async () => {
    if (selectedAssets.length === 0) {
      alert("Please select at least one asset to dispose");
      return;
    }

    if (!confirm(`Are you sure you want to mark ${selectedAssets.length} asset(s) as disposed?`)) {
      return;
    }

    try {
      // Get asset statuses to find "Disposed" status ID
      const statuses = await getAssetStatuses();
      const disposedStatus = statuses.find((status: any) => status.status_name === "Disposed");
      
      if (!disposedStatus) {
        alert("Disposed status not found in system");
        return;
      }

      // Update all selected assets to "Disposed" status
      await Promise.all(
        selectedAssets.map(assetId => 
          updateAsset(assetId, { status_id: disposedStatus.status_id })
        )
      );
      
      // Remove disposed assets from local state
      setAssets(prev => prev.filter(asset => !selectedAssets.includes(asset.asset_id)));
      setSelectedAssets([]);
      
      alert(`${selectedAssets.length} asset(s) successfully marked as disposed`);
      
    } catch (err: any) {
      console.error("Failed to update asset status:", err);
      
      if (err.response?.status === 401) {
        alert("Your session has expired. Please log in again and try.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      
      alert(err.response?.data?.error || "Failed to update asset status");
    }
  };

  if (!show || !workstation) return null;

  return createPortal(
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 backdrop-blur-md bg-black/20 z-[9999]"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div 
        className="fixed inset-0 z-[10000] overflow-y-auto"
        onClick={onClose}
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold">
                  {workstation.workstation_name}
                </h3>
                <p className="text-blue-100 text-sm">
                  {workstation.laboratories?.lab_name || "No Laboratory"}
                </p>
              </div>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-blue-700 cursor-pointer"
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
                    {workstation.laboratories?.lab_name || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Location
                  </h4>
                  <p className="text-gray-900 font-medium">
                    {workstation.laboratories?.location || "N/A"}
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
                <div className="flex space-x-2">
                  {selectedAssets.length > 0 && (
                    <button
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center shadow-sm cursor-pointer"
                      onClick={handleBulkDispose}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Dispose Selected ({selectedAssets.length})
                    </button>
                  )}
                  <button
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center shadow-sm cursor-pointer"
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
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : assets.filter(asset => asset.asset_details?.asset_statuses?.status_name !== "Disposed").length === 0 ? (
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
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={handleSelectAll}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title={selectedAssets.length === assets.length ? "Deselect All" : "Select All"}
                          >
                            {selectedAssets.length === assets.length ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
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
                      {assets
                        .filter(
                          (asset) =>
                            asset.asset_details?.asset_statuses?.status_name !==
                            "Disposed"
                        )
                        .map((asset) => (
                        <tr
                          key={asset.asset_id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleAssetSelection(asset.asset_id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title={selectedAssets.includes(asset.asset_id) ? "Deselect" : "Select"}
                            >
                              {selectedAssets.includes(asset.asset_id) ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {asset.asset_details?.property_tag_no || asset.units?.unit_name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asset.units?.unit_name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {asset.asset_details?.serial_number || "-"}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate"
                            title={asset.asset_details?.description}
                          >
                            {asset.asset_details?.description || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.asset_details?.asset_statuses?.status_name)}`}
                            >
                              {asset.asset_details?.asset_statuses?.status_name ||
                                "Unknown"}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-500 max-w-[150px] truncate"
                            title={asset.asset_details?.asset_remarks}
                          >
                            {asset.asset_details?.asset_remarks || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex justify-center space-x-2">
                            
                          <button
  onClick={() => handleEditAsset(asset)}
  className="text-blue-600 hover:text-blue-800 p-2 transition-colors cursor-pointer"
  title="Edit Asset Details"
>
  <Edit className="w-4 h-4" />
</button>

<button
  onClick={() => handleDeleteAsset(asset.asset_id)}
  className="text-red-400 hover:text-red-600 p-2 transition-colors cursor-pointer"
  title="Dispose Asset"
>
  <Trash2 className="w-4 h-4" />
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
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium cursor-pointer"
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
    , document.body);
};

export default ViewWorkstationModal;
