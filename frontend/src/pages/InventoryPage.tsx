import { useState, useEffect } from "react";
import api from "../api/axios";
import { getLaboratories } from "../api/laboratories";
import { getInventory, deleteAsset } from "../api/inventory";
import { getAllWorkstations } from "../api/workstations";
import AddAssetModal from "../components/inventory/AddAssetModal";
import EditAssetModal from "../components/inventory/EditAssetModal";
import ViewWorkstationModal from "../components/inventory/ViewWorkstationModal";
import EditWorkstationModal from "../components/inventory/EditWorkstationModal";
import AddWorkstationModal from "../components/inventory/AddWorkstationModal";
import WorkstationReport from "../components/inventory/WorkstationReport";
import { useAuth } from "../context/AuthContext";
// ✅ IMPORT ICONS HERE
import { Plus, FileText } from "lucide-react";

// Import our newly extracted table components
import WorkstationTable from "../components/inventory/WorkstationTable";
import UnassignedAssetTable from "../components/inventory/UnassignedAssetTable";

interface Asset {
  asset_id: number;
  lab_id?: number;
  property_tag_no: string;
  item_name: string;
  description: string;
  serial_number: string;
  quantity: number;
  date_of_purchase: string;
  laboratories?: { lab_id: number; lab_name: string };
  units?: { unit_name: string };
  workstation?: { workstation_name: string };
  details?: {
    property_tag_no: string;
    item_name: string;
    description: string;
    serial_number: string;
    quantity: number;
    date_of_purchase: string;
  };
}

interface Workstation {
  workstation_id: number;
  workstation_name: string;
  lab_id: number | null;
  created_at: string;
  workstation_remarks?: string;
  current_status?: {
    status_name: string;
  };
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

interface Laboratory {
  lab_id: number;
  lab_name: string;
  location?: string;
}

const InventoryPage = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [showWSModal, setShowWSModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingWorkstation, setViewingWorkstation] =
    useState<Workstation | null>(null);
  const [editingWorkstation, setEditingWorkstation] =
    useState<Workstation | null>(null);
  const [showViewWSModal, setShowViewWSModal] = useState(false);
  const [showEditWSModal, setShowEditWSModal] = useState(false);
  const [showUnassignedAssets, setShowUnassignedAssets] = useState(false);
  const [showWorkstationReport, setShowWorkstationReport] = useState(false);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);

  useEffect(() => {
    fetchInventory();
    fetchWorkstations();
    fetchLaboratories();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await getInventory();
      setAssets(data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const fetchWorkstations = async () => {
    try {
      const data = await getAllWorkstations();
      setWorkstations(data);
    } catch (err) {
      console.error("Error fetching workstations:", err);
    }
  };

  const fetchLaboratories = async () => {
    try {
      const labs = await getLaboratories();
      setLaboratories(labs);
    } catch (err) {
      console.error("Error fetching laboratories:", err);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setShowEditModal(true);
  };

  const handleDelete = async (assetId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this asset? This action cannot be undone.",
      )
    )
      return;
    try {
      await deleteAsset(assetId);
      await fetchInventory();
      await fetchWorkstations();
    } catch (err: any) {
      console.error("Failed to delete asset:", err);
      alert(err.response?.data?.error || "Failed to delete asset");
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
    if (
      !confirm(
        "Are you sure you want to delete this workstation? This will also remove all asset assignments.",
      )
    )
      return;
    try {
      await api.delete(`/workstations/${workstationId}`);
      await fetchWorkstations();
      await fetchInventory();
    } catch (err: any) {
      console.error("Failed to delete workstation:", err);
      alert(err.response?.data?.error || "Failed to delete workstation");
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

  // --- Filtering Logic ---
  const unassignedAssets = assets.filter(
    (asset: any) => !asset.workstation && !asset.workstation_id,
  );

  const filteredWorkstations = (
    selectedLabId
      ? workstations.filter((ws) => ws.lab_id === selectedLabId)
      : [...workstations]
  ).sort((a, b) =>
    a.workstation_name.localeCompare(b.workstation_name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  const filteredUnassignedAssets = selectedLabId
    ? unassignedAssets.filter((asset) => asset.lab_id === selectedLabId)
    : unassignedAssets;

  const availableLabs =
    user?.role === "Admin"
      ? laboratories
      : user?.lab_id
        ? laboratories.filter((lab) => lab.lab_id === user.lab_id)
        : [];

  useEffect(() => {
    if (user?.role === "Custodian" && user.lab_id && !selectedLabId) {
      setSelectedLabId(user.lab_id);
    }
  }, [user, selectedLabId]);

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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Inventory Management
        </h1>
        <p className="text-gray-600">
          Manage workstations and their assigned inventory assets
        </p>
        {/* Lab Assigned Indicator for Custodians */}
        {user?.role === "Custodian" && user?.lab_id && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            📍 Assigned Lab: {availableLabs.find(lab => lab.lab_id === user.lab_id)?.lab_name || "Loading..."}
          </div>
        )}
      </div>

      {/* Filter Toggle & Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowUnassignedAssets(false)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                !showUnassignedAssets
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🖥️ Workstations ({filteredWorkstations.length})
            </button>
            <button
              onClick={() => setShowUnassignedAssets(true)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                showUnassignedAssets
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📦 Other Assets ({filteredUnassignedAssets.length})
            </button>

            {/* Lab Filter */}
            {(user?.role === "Admin" ||
              (user?.role === "Custodian" && availableLabs.length > 1)) && (
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="lab-filter"
                  className="text-sm font-medium text-gray-700"
                >
                  Filter by Lab:
                </label>
                <select
                  id="lab-filter"
                  value={selectedLabId || ""}
                  onChange={(e) =>
                    setSelectedLabId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Laboratories</option>
                  {availableLabs.map((lab) => (
                    <option key={lab.lab_id} value={lab.lab_id}>
                      {lab.lab_name} {lab.location && `(${lab.location})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!showUnassignedAssets && (
              <button
                className="h-10 px-4 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 flex items-center font-medium shadow-sm transition-colors"
                onClick={() => setShowWSModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Workstation
              </button>
            )}

            {(user?.role === "Admin" || user?.role === "Custodian") && (
              <>
                <button
                  className="h-10 px-4 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center font-medium shadow-sm transition-colors"
                  onClick={() => setShowModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Asset
                </button>
                <button
                  className="h-10 px-4 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center font-medium shadow-sm transition-colors"
                  onClick={() => setShowWorkstationReport(true)}
                >
                  <FileText className="w-4 h-4 mr-2" /> Workstation Report
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Rendered via Components */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {!showUnassignedAssets ? (
          <WorkstationTable
            workstations={filteredWorkstations}
            onView={handleViewWorkstation}
            onEdit={handleEditWorkstation}
            onDelete={handleDeleteWorkstation}
            getStatusColor={getStatusColor}
          />
        ) : (
          <UnassignedAssetTable
            assets={filteredUnassignedAssets}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modals remain exactly the same */}
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
        onSuccess={() => fetchWorkstations()}
      />
      <ViewWorkstationModal
        show={showViewWSModal}
        workstation={viewingWorkstation}
        onClose={() => {
          setShowViewWSModal(false);
          setViewingWorkstation(null);
        }}
        onSuccess={handleWorkstationModalSuccess}
      />
      <EditWorkstationModal
        show={showEditWSModal}
        workstation={editingWorkstation}
        onClose={() => {
          setShowEditWSModal(false);
          setEditingWorkstation(null);
        }}
        onSuccess={handleEditWorkstationModalSuccess}
      />
      <WorkstationReport
        show={showWorkstationReport}
        onClose={() => setShowWorkstationReport(false)}
      />
    </div>
  );
};

export default InventoryPage;
