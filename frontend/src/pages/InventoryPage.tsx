import { useState, useEffect } from "react";
import { getLaboratories } from "../api/laboratories";
import { getInventory, deleteAsset, getWorkstationAssets, updateAsset } from "../api/inventory";
import { getAllWorkstations } from "../api/workstations";
import { getWorkstationPMCReports } from "../api/maintenance";
import { getCurrentQuarter } from "../utils/quarterLogic";
import AddAssetModal from "../components/inventory/AddAssetModal";
import EditAssetModal from "../components/inventory/EditAssetModal";
import ViewWorkstationModal from "../components/inventory/ViewWorkstationModal";
import EditWorkstationModal from "../components/inventory/EditWorkstationModal";
import AddWorkstationModal from "../components/inventory/AddWorkstationModal";
import WorkstationReport from "../components/inventory/WorkstationReport";
import { useAuth } from "../context/AuthContext";
// ✅ IMPORT ICONS HERE
import { Plus, FileText, Search } from "lucide-react";
import UploadAssetModal from "../components/inventory/UploadAssetModal";

// Import our newly extracted table components
import WorkstationTable from "../components/inventory/WorkstationTable";
import UnassignedAssetTable from "../components/inventory/UnassignedAssetTable";

interface Asset {
  asset_id: number;
  lab_id?: number;
  property_tag_no?: string;
  item_name?: string;
  description?: string;
  serial_number?: string;
  quantity?: number;
  date_of_purchase?: string;
  laboratories?: { lab_id: number; lab_name: string };
  units?: { unit_name: string };
  workstation?: { workstation_name: string };
  asset_details?: {
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
  const [workstationSearch, setWorkstationSearch] = useState<string>("");
  const [assetSearch, setAssetSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pmcReports, setPmcReports] = useState<Record<number, any>>({});

  useEffect(() => {
    fetchInventory();
    fetchWorkstations();
    fetchLaboratories();
  }, []);

  // Fetch PMC reports when workstations change
  useEffect(() => {
    if (workstations.length > 0) {
      fetchPMCReports();
    }
  }, [workstations]);

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

  const fetchPMCReports = async () => {
    try {
      const currentQuarter = getCurrentQuarter();
      const workstationIds = workstations.map((ws) => ws.workstation_id);
      
      // Only fetch for current quarter first
      try {
        const reports = await getWorkstationPMCReports(workstationIds, currentQuarter);
        setPmcReports(reports);
      } catch (err) {
        // If current quarter has no reports, try other quarters
        const quarters = ["1st", "2nd", "3rd", "4th"].filter(q => q !== currentQuarter);
        const allReports: Record<number, any> = {};
        
        for (const quarter of quarters) {
          try {
            const reports = await getWorkstationPMCReports(workstationIds, quarter);
            
            // Merge reports, keeping the latest for each workstation
            Object.entries(reports).forEach(([workstationId, report]) => {
              const existingReport = allReports[parseInt(workstationId)];
              
              // If no existing report or this one is newer, use this report
              if (!existingReport || (report && new Date(report.report_date) > new Date(existingReport.report_date))) {
                allReports[parseInt(workstationId)] = report;
              }
            });
          } catch (err) {
            // Silently handle quarters with no reports
          }
        }
        
        setPmcReports(allReports);
      }
    } catch (err) {
      console.error("Error fetching PMC reports:", err);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setShowEditModal(true);
  };

  const handleDelete = async (assetId: number) => {
    // Use a custom confirmation instead of browser confirm to avoid focus issues
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this asset? This action cannot be undone."
    );

    if (!shouldDelete) return;

    try {
      await deleteAsset(assetId);

      // Remove the deleted asset from state instead of refreshing all data
      setAssets((prev) => prev.filter((asset) => asset.asset_id !== assetId));
      setWorkstations((prev) =>
        prev.map((ws) => ({
          ...ws,
          assets:
            ws.assets?.filter((asset) => asset.asset_id !== assetId) || [],
        }))
      );

      // Show success message without using alert (which can cause focus issues)
      console.log("Asset deleted successfully");
    } catch (err: any) {
      console.error("Failed to delete asset:", err);
      // Use console.error instead of alert to avoid focus issues
      console.error(
        "Delete error:",
        err.response?.data?.error || "Failed to delete asset"
      );
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

  const handleDisposeWorkstationAssets = async (workstationId: number) => {
    if (
      !confirm(
        "Are you sure you want to dispose all assets in this workstation? This will change their status to 'Disposed' and cannot be undone."
      )
    )
      return;
    
    try {
      // Get all assets for this workstation
      const assets = await getWorkstationAssets(workstationId);
      
      if (assets.length === 0) {
        alert("No assets found in this workstation to dispose.");
        return;
      }
      
      // Update each asset's status to 'Disposed' (status_id = 6)
      const updatePromises = assets.map(async (asset: any) => {
        await updateAsset(asset.asset_id, {
          asset_details: {
            status_id: 6 // 'Disposed' status
          }
        });
      });
      
      await Promise.all(updatePromises);
      
      // Refresh data to show updated status
      await fetchWorkstations();
      await fetchInventory();
      
      console.log(`Successfully disposed ${assets.length} assets from workstation ${workstationId}`);
    } catch (err: any) {
      console.error("Failed to dispose workstation assets:", err);
      alert(err.response?.data?.error || "Failed to dispose workstation assets");
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
  const unassignedAssets = (assets || []).filter(
    (asset: any) => !asset.workstation && !asset.workstation_id
  );

  const filteredWorkstations = (
    selectedLabId
      ? (workstations || []).filter((ws) => ws.lab_id === selectedLabId)
      : [...(workstations || [])]
  )
    .filter((ws) =>
      (ws.workstation_name || "")
        .toLowerCase()
        .includes(workstationSearch.toLowerCase())
    )
    .sort((a, b) =>
      (a.workstation_name || "").localeCompare(
        b.workstation_name || "",
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      )
    );

  // Pagination logic for workstations
  const totalPages = Math.ceil(filteredWorkstations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWorkstations = filteredWorkstations.slice(startIndex, endIndex);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [workstationSearch, selectedLabId]);

  const filteredUnassignedAssets = unassignedAssets
    .filter((asset) => {
      const searchTerm = assetSearch.toLowerCase();
      return (
        // Basic asset fields
        (asset.item_name || "").toLowerCase().includes(searchTerm) ||
        // Asset details fields (the actual data structure)
        (asset.asset_details?.property_tag_no || "")
          .toLowerCase()
          .includes(searchTerm) ||
        (asset.asset_details?.description || "")
          .toLowerCase()
          .includes(searchTerm) ||
        (asset.asset_details?.serial_number || "")
          .toLowerCase()
          .includes(searchTerm) ||
        // Related fields
        (asset.units?.unit_name || "").toLowerCase().includes(searchTerm) ||
        (asset.laboratories?.lab_name || "")
          .toLowerCase()
          .includes(searchTerm) ||
        // Numeric fields converted to string
        (asset.quantity?.toString() || "").includes(searchTerm) ||
        (asset.asset_id?.toString() || "").includes(searchTerm) ||
        // Date fields (search year, month, day)
        (asset.date_of_purchase
          ? new Date(asset.date_of_purchase)
              .toLocaleDateString()
              .toLowerCase()
              .includes(searchTerm)
          : false)
      );
    })
    .filter((asset) => (selectedLabId ? asset.lab_id === selectedLabId : true));

  const availableLabs =
    user?.role === "Admin"
      ? laboratories
      : user?.lab_id
      ? laboratories.filter((lab) => lab.lab_id === user.lab_id)
      : [];

  useEffect(() => {
    if (user?.role === "Custodian" && user.lab_id && !selectedLabId) {
      setSelectedLabId(user.lab_id);
    } else if (user?.role === "Custodian" && !user.lab_id) {
      // Custodian with no lab assignment - clear any selection
      setSelectedLabId(null);
    }
  }, [user, selectedLabId]);

  // Clear search when switching between views
  useEffect(() => {
    setWorkstationSearch("");
    setAssetSearch("");
  }, [showUnassignedAssets]);

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Inventory Management
        </h1>
        <p className="text-gray-600">
          Manage workstations and their assigned inventory assets
        </p>
        {/* Lab Assigned Indicator for Custodians */}
        {user?.role === "Custodian" && (
          <div className="mt-2">
            {user?.lab_id ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                📍 Assigned Lab:{" "}
                {availableLabs.find((lab) => lab.lab_id === user.lab_id)
                  ?.lab_name || "Loading..."}
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                ⚠️ No Laboratory Assigned - Contact Administrator
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Toggle & Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {/* Lab Filter & Toggles - Top Row for Admins only */}
        {user?.role === "Admin" && availableLabs.length > 0 && (
          <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="lab-filter"
                  className="text-sm font-medium text-gray-700"
                >
                  Filter by Laboratory:
                </label>
                <select
                  id="lab-filter"
                  value={selectedLabId || ""}
                  onChange={(e) =>
                    setSelectedLabId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="h-9 px-3 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Laboratories</option>
                  {availableLabs.map((lab) => (
                    <option key={lab.lab_id} value={lab.lab_id}>
                      {lab.lab_name} {lab.location && `(${lab.location})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Toggles - Always show for all users */}
              <>
                <button
                  onClick={() => setShowUnassignedAssets(false)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                    !showUnassignedAssets
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🖥️ Workstations ({filteredWorkstations.length})
                </button>
                <button
                  onClick={() => setShowUnassignedAssets(true)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                    showUnassignedAssets
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  📦 Other Assets ({filteredUnassignedAssets.length})
                </button>
              </>
            </div>
          </div>
        )}

        {/* View Toggles for Custodians - Separate row without lab filter */}
        {user?.role === "Custodian" && (
          <div className="mb-4 flex items-center justify-start">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowUnassignedAssets(false)}
                className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                  !showUnassignedAssets
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🖥️ Workstations ({filteredWorkstations.length})
              </button>
              <button
                onClick={() => setShowUnassignedAssets(true)}
                className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                  showUnassignedAssets
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📦 Other Assets ({filteredUnassignedAssets.length})
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            {/* Workstation Search - Moved to first position */}
            {!showUnassignedAssets && (
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="workstation-search"
                  className="text-sm font-medium text-gray-700"
                >
                  Search Workstation:
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="workstation-search"
                    type="text"
                    value={workstationSearch}
                    onChange={(e) => {
                      setWorkstationSearch(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    placeholder="Search by name..."
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  />
                  {workstationSearch && (
                    <button
                      onClick={() => setWorkstationSearch("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Asset Search - Only show when viewing unassigned assets */}
            {showUnassignedAssets && (
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="asset-search"
                  className="text-sm font-medium text-gray-700"
                >
                  Search Assets:
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="asset-search"
                    type="text"
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    placeholder="Search assets..."
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  />
                  {assetSearch && (
                    <button
                      onClick={() => setAssetSearch("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons - Moved beside search */}
            {!showUnassignedAssets && (
              <button
                className="h-10 px-4 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 flex items-center font-medium shadow-sm transition-colors cursor-pointer"
                onClick={() => setShowWSModal(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Workstation
              </button>
            )}
            {(user?.role === "Admin" || user?.role === "Custodian") && (
              <>
                <button
                  className="h-10 px-4 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center font-medium shadow-sm transition-colors cursor-pointer"
                  onClick={() => setShowModal(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Asset
                </button>
                <button
                  className="h-10 px-4 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center font-medium shadow-sm transition-colors cursor-pointer"
                  onClick={() => setShowWorkstationReport(true)}
                >
                  <FileText className="w-4 h-4 mr-1.5" /> Workstation Report
                </button>
                {/* ✅ Show Upload Data button if Custodian */}
                {user?.role === "Custodian" && (
                  <button
                    className="h-9 px-3 bg-[#eab308] text-white text-sm rounded-md hover:bg-yellow-600 flex items-center font-medium transition-colors cursor-pointer"
                    onClick={() => setShowUploadModal(true)}
                  >
                    {/* Simple upload icon, adjust as needed */}
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v16h16V4M12 16V8M12 8l4 4M12 8l-4 4"
                      />
                    </svg>
                    Upload Data (XLSX)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Rendered via Components */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {!showUnassignedAssets ? (
          <>
            <WorkstationTable
              workstations={paginatedWorkstations}
              onView={handleViewWorkstation}
              onEdit={handleEditWorkstation}
              onDispose={handleDisposeWorkstationAssets}
              getStatusColor={getStatusColor}
              pmcReports={pmcReports}
            />
            
            {/* Pagination Controls for Workstations */}
            {totalPages > 1 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredWorkstations.length)} of{" "}
                  {filteredWorkstations.length} workstations
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
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
      <UploadAssetModal
        show={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          fetchInventory();
          fetchWorkstations();
        }}
      />
    </div>
  );
};

export default InventoryPage;
