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

const ViewWorkstationModal: React.FC<Props> = ({ show, workstation, onClose, onSuccess }) => {
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
      console.log("🔍 Fetching assets for workstation:", workstation.workstation_id);
      const res = await api.get(`/inventory?workstation_id=${workstation.workstation_id}`);
      console.log("📦 Received assets:", res.data);
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
    if (!confirm('Are you sure you want to remove this asset from the workstation? This will delete the asset completely.')) {
      return;
    }

    try {
      await api.delete(`/inventory/${assetId}`);
      await fetchWorkstationAssets();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to delete asset:', err);
      alert(err.response?.data?.error || 'Failed to delete asset');
    }
  };

  const handleAssetModalSuccess = () => {
    setShowEditModal(false);
    setEditingAsset(null);
    setShowAddModal(false);
    fetchWorkstationAssets();
    onSuccess();
  };

  const handleAddAsset = () => {
    setShowAddModal(true);
  };

  if (!show || !workstation) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{workstation.workstation_name}</h3>
                <p className="text-blue-100 text-sm">{workstation.laboratory?.lab_name || 'No Laboratory'}</p>
              </div>
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

            {/* Workstation Info */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Laboratory</h4>
                  <p className="text-lg font-semibold text-gray-900">{workstation.laboratory?.lab_name || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <p className="text-lg font-semibold text-gray-900">{workstation.laboratory?.location || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Total Assets</h4>
                  <p className="text-lg font-semibold text-gray-900">{assets.length} assets</p>
                </div>
              </div>
            </div>

            {/* Assets Table */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Assigned Assets</h4>
                <button
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
                  onClick={handleAddAsset}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Asset
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500">No assets assigned to this workstation</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Tag</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assets.map((asset) => (
                        <tr key={asset.asset_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-blue-600">{asset.details?.property_tag_no || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.units?.unit_name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.details?.serial_number || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.details?.quantity || 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button 
                              className="p-1 text-blue-600 hover:text-blue-800"
                              onClick={() => handleEditAsset(asset)}
                              title="Edit asset"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              className="p-1 text-red-600 hover:text-red-800 ml-1"
                              onClick={() => handleDeleteAsset(asset.asset_id)}
                              title="Delete asset"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex items-center justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Asset Modal */}
      <EditAssetModal
        show={showEditModal}
        asset={editingAsset}
        onClose={() => {
          setShowEditModal(false);
          setEditingAsset(null);
        }}
        onSuccess={handleAssetModalSuccess}
      />

      {/* Add Asset Modal */}
      <AddAssetModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAssetModalSuccess}
      />
    </>
  );
};

export default ViewWorkstationModal;
