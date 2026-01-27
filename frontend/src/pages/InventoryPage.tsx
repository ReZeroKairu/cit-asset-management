import { useState, useEffect } from "react";
import api from "../api/axios";
import AddAssetModal from "../components/inventory/AddAssetModal";
import EditAssetModal from "../components/inventory/EditAssetModal";
import ViewWorkstationModal from "../components/inventory/ViewWorkstationModal";
import EditWorkstationModal from "../components/inventory/EditWorkstationModal";
import { useAuth } from "../context/AuthContext";
import AddWorkstationModal from "../components/inventory/AddWorkstationModal";

interface Asset {
  asset_id: number;
  property_tag_no: string;
  item_name: string;
  description: string;
  serial_number: string;
  quantity: number;
  laboratories?: { lab_name: string };
  units?: { unit_name: string };
  workstation?: { workstation_name: string };
  date_of_purchase: string;
}

interface Workstation {
  workstation_id: number;
  workstation_name: string;
  lab_id: number | null;
  created_at: string;
  laboratory?: {
    lab_name: string;
    location?: string;
  };
  assets?: {
    asset_id: number;
    item_name: string;
    property_tag_no: string;
    serial_number: string;
    units: {
      unit_name: string;
    };
  }[];
}

const InventoryPage = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [showWSModal, setShowWSModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingWorkstation, setViewingWorkstation] = useState<Workstation | null>(null);
  const [editingWorkstation, setEditingWorkstation] = useState<Workstation | null>(null);
  const [showViewWSModal, setShowViewWSModal] = useState(false);
  const [showEditWSModal, setShowEditWSModal] = useState(false);
  const [showUnassignedAssets, setShowUnassignedAssets] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchWorkstations();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get("/inventory");
      setAssets(res.data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const fetchWorkstations = async () => {
    try {
      const res = await api.get("/workstations");
      setWorkstations(res.data);
    } catch (err) {
      console.error("Error fetching workstations:", err);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setShowEditModal(true);
  };

  const handleDelete = async (assetId: number) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/inventory/${assetId}`);
      await fetchInventory();
      await fetchWorkstations();
    } catch (err: any) {
      console.error('Failed to delete asset:', err);
      alert(err.response?.data?.error || 'Failed to delete asset');
    }
  };

  const handleViewWorkstation = (workstation: Workstation) => {
    setViewingWorkstation(workstation);
    setShowViewWSModal(true);
  };

  const handleEditWorkstation = (workstation: Workstation) => {
    setEditingWorkstation(workstation);
    setShowEditWSModal(true);
  };

  const handleDeleteWorkstation = async (workstationId: number) => {
    if (!confirm('Are you sure you want to delete this workstation? This will also remove all asset assignments.')) {
      return;
    }

    try {
      await api.delete(`/workstations/${workstationId}`);
      await fetchWorkstations();
      await fetchInventory(); // Refresh assets in case any were assigned
    } catch (err: any) {
      console.error('Failed to delete workstation:', err);
      alert(err.response?.data?.error || 'Failed to delete workstation');
    }
  };

  const handleWorkstationModalSuccess = () => {
    setShowViewWSModal(false);
    setViewingWorkstation(null);
    fetchWorkstations();
    fetchInventory();
  };

  const handleEditWorkstationModalSuccess = () => {
    setShowEditWSModal(false);
    setEditingWorkstation(null);
    fetchWorkstations();
  };

  const unassignedAssets = assets.filter(asset => !asset.workstation);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600">Manage workstations and their assigned inventory assets</p>
      </div>

      {/* Filter Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowUnassignedAssets(false)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                !showUnassignedAssets
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🖥️ Workstations ({workstations.length})
            </button>
            <button
              onClick={() => setShowUnassignedAssets(true)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                showUnassignedAssets
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Unassigned Assets ({unassignedAssets.length})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {!showUnassignedAssets && (
              <button
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 flex items-center"
                onClick={() => setShowWSModal(true)}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Add Workstation
              </button>
            )}
            
            {(user?.role === "Admin" || user?.role === "Custodian") && (
              <button
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
                onClick={() => setShowModal(true)}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Asset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {!showUnassignedAssets ? (
          // Workstations View
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workstation Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laboratory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workstations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No workstations found.
                    </td>
                  </tr>
                ) : (
                  workstations.map((workstation) => (
                    <tr key={workstation.workstation_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-blue-600">
                          {workstation.workstation_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {workstation.laboratory?.lab_name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workstation.laboratory?.location || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(workstation.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800"
                          onClick={() => handleViewWorkstation(workstation)}
                          title="View workstation details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 text-gray-600 hover:text-gray-800 ml-1"
                          onClick={() => handleEditWorkstation(workstation)}
                          title="Edit workstation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 text-red-600 hover:text-red-800 ml-1"
                          onClick={() => handleDeleteWorkstation(workstation.workstation_id)}
                          title="Delete workstation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // Unassigned Assets View
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Tag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unassignedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No unassigned assets found. All assets are assigned to workstations.
                    </td>
                  </tr>
                ) : (
                  unassignedAssets.map((asset) => (
                    <tr key={asset.asset_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-blue-600">
                          {asset.property_tag_no}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.item_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {asset.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.serial_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {asset.laboratories?.lab_name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.units?.unit_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800"
                          onClick={() => handleEdit(asset)}
                          title="Edit asset"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 text-red-600 hover:text-red-800 ml-1"
                          onClick={() => handleDelete(asset.asset_id)}
                          title="Delete asset"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddAssetModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          fetchInventory();
          fetchWorkstations();
        }}
      />

      <EditAssetModal
        show={showEditModal}
        asset={editingAsset}
        onClose={() => {
          setShowEditModal(false);
          setEditingAsset(null);
        }}
        onSuccess={() => {
          fetchInventory();
          fetchWorkstations();
        }}
      />

      <AddWorkstationModal
        show={showWSModal}
        onClose={() => setShowWSModal(false)}
        onSuccess={() => {
          fetchWorkstations();
        }}
      />

      {/* View Workstation Modal */}
      <ViewWorkstationModal
        show={showViewWSModal}
        workstation={viewingWorkstation}
        onClose={() => {
          setShowViewWSModal(false);
          setViewingWorkstation(null);
        }}
        onSuccess={handleWorkstationModalSuccess}
      />

      {/* Edit Workstation Modal */}
      <EditWorkstationModal
        show={showEditWSModal}
        workstation={editingWorkstation}
        onClose={() => {
          setShowEditWSModal(false);
          setEditingWorkstation(null);
        }}
        onSuccess={handleEditWorkstationModalSuccess}
      />
    </div>
  );
};

export default InventoryPage;
