import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Trash2, Package, Monitor, Cpu, Monitor as MonitorIcon, Search } from "lucide-react";
import { getInventory } from "../api/inventory";
import type { Asset } from "../api/inventory";

const ArchiveDisposalsPage = () => {
  const [disposedAssets, setDisposedAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkstation, setSelectedWorkstation] = useState<{ id: number; name: string; assets: Asset[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilterType, setDateFilterType] = useState<"all" | "date_purchased" | "date_disposed">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<"workstation" | "other">("workstation");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all assets and filter by "Disposed" status
        const allAssetsResponse = await getInventory();
        
        // Filter assets by status name "Disposed"
        const disposedAssets = allAssetsResponse.filter(
          (asset: Asset) => asset.asset_details?.asset_statuses?.status_name === "Disposed"
        );
        
        setDisposedAssets(disposedAssets);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching disposed assets:", err);
        setError("Failed to fetch disposed assets");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUnitIcon = (unitName?: string) => {
    const name = (unitName || "").toLowerCase();
    if (name.includes("monitor") || name.includes("display")) {
      return <Monitor className="w-4 h-4 text-gray-400" />;
    }
    if (name.includes("cpu") || name.includes("computer")) {
      return <Cpu className="w-4 h-4 text-gray-400" />;
    }
    return <Package className="w-4 h-4 text-gray-400" />;
  };

  // Open workstation modal
  const openWorkstationModal = (workstationId: number, workstationName: string, assets: Asset[]) => {
    setSelectedWorkstation({ id: workstationId, name: workstationName, assets });
    setCurrentPage(1);
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setDateFilterType("all");
  };

  // Close modal
  const closeModal = () => {
    setSelectedWorkstation(null);
    setCurrentPage(1);
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setDateFilterType("all");
  };

  // Filter assets based on search (for main workstation list)
  const filterAssets = (assets: Asset[]) => {
    return assets.filter(asset => {
      // Search filter - only search workstation names
      const searchMatch = searchTerm === "" || 
        asset.workstations?.workstation_name?.toLowerCase().includes(searchTerm.toLowerCase());

      return searchMatch;
    });
  };

  // Filter modal assets based on search (for individual assets within workstation)
  const filterModalAssets = (assets: Asset[]) => {
    return assets.filter(asset => {
      // Search filter - search asset details
      const searchMatch = searchTerm === "" || 
        asset.asset_id?.toString().includes(searchTerm.toLowerCase()) ||
        asset.asset_details?.property_tag_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_details?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_details?.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.units?.unit_name?.toLowerCase().includes(searchTerm.toLowerCase());

      return searchMatch;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setDateFilterType("all");
    setCurrentPage(1);
  };

  // Get paginated assets
  const getPaginatedAssets = (assets: Asset[]) => {
    const filteredAssets = filterModalAssets(assets);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAssets.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = (assets: Asset[]) => {
    const filteredAssets = filterModalAssets(assets);
    return Math.ceil(filteredAssets.length / itemsPerPage);
  };

  // Add ESC key support
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedWorkstation) {
        closeModal();
      }
    };

    if (selectedWorkstation) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedWorkstation]);

  // Group assets by workstation
  const assetsByWorkstation = disposedAssets.reduce((acc, asset) => {
    const workstationId = asset.workstation_id ?? -1; // Use -1 for null, not 0
    const workstationName = asset.workstations?.workstation_name || "Unassigned";
    
    if (!acc[workstationId]) {
      acc[workstationId] = {
        workstationId,
        workstationName,
        assets: []
      };
    }
    
    acc[workstationId].assets.push(asset);
    return acc;
  }, {} as Record<number, { workstationId: number; workstationName: string; assets: Asset[] }>);

  // Get assets based on view mode
  const getAssetsByViewMode = () => {
    if (viewMode === "workstation") {
      // Return all assets (grouped by workstation)
      return disposedAssets;
    } else {
      // Return only assets not assigned to workstations
      return disposedAssets.filter(asset => !asset.workstation_id);
    }
  };

  // Filter assets for current view mode
  const getFilteredAssets = () => {
    const assets = getAssetsByViewMode();
    return filterAssets(assets);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading disposed assets...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Asset Disposals</h1>
        <p className="text-gray-600">Archive of all disposed assets (status changed to "Disposed")</p>
      </div>

      
      {/* Filters Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search workstations by name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
                  </div>
      </div>

      {/* Disposed Assets Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Disposed Assets by Workstation
        </h2>
        {
          // Workstation Assets View
          Object.values(assetsByWorkstation).filter((workstation) => 
            searchTerm === "" || 
            workstation.workstationName.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? "No Workstations Found" : "No Disposed Assets"}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? `No workstations match "${searchTerm}"` : "No assets have been marked as disposed."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workstation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assets Count
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.values(assetsByWorkstation)
                      .filter((workstation) => 
                        searchTerm === "" || 
                        workstation.workstationName.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((workstation) => (
                      <tr 
                        key={workstation.workstationId} 
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => openWorkstationModal(workstation.workstationId, workstation.workstationName, workstation.assets)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <MonitorIcon className="w-4 h-4 text-gray-400" />
                            {workstation.workstationName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <Badge className="bg-red-100 text-red-800">
                            {workstation.assets.length} disposed
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          <Badge className="bg-gray-100 text-gray-800">
                            Disposed
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }
      </div>

      {/* Workstation Assets Modal */}
      {selectedWorkstation && createPortal(
        <>
          {/* Modal Backdrop */}
          <div 
            className="fixed inset-0 backdrop-blur-md bg-black/20 z-[9999]"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div 
            className="fixed inset-0 z-10000 overflow-y-auto"
            onClick={closeModal}
          >
            <div className="flex items-center justify-center min-h-screen px-4">
              <div 
                className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Disposed Assets - {selectedWorkstation.name}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {filterModalAssets(selectedWorkstation.assets).length} assets found
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-blue-700 cursor-pointer"
                    onClick={closeModal}
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

                {/* Modal Filters */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search by property tag, description, or serial..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Filter Type
                      </label>
                      <select
                        value={dateFilterType}
                        onChange={(e) => {
                          setDateFilterType(e.target.value as "all" | "date_purchased" | "date_disposed");
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Dates</option>
                        <option value="date_disposed">Date Disposed</option>
                        <option value="date_purchased">Date Purchased</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date ({dateFilterType === "all" ? "Any" : dateFilterType === "date_purchased" ? "Purchase" : "Dispose"})
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date ({dateFilterType === "all" ? "Any" : dateFilterType === "date_purchased" ? "Purchase" : "Dispose"})
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={clearAllFilters}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                          title="Clear all filters"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-auto px-6 py-4">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Asset ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Property Tag
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Description
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Serial Number
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Unit Type
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Date Purchased
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Date Disposed
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Asset Personnel
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getPaginatedAssets(selectedWorkstation.assets).map((asset) => (
                          <tr key={asset.asset_id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{asset.asset_id}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                              {asset.asset_details?.property_tag_no || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">
                              {asset.asset_details?.description || "No description"}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                              {asset.asset_details?.serial_number || "N/A"}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                {getUnitIcon(asset.units?.unit_name)}
                                {asset.units?.unit_name || "N/A"}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-center">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                Disposed
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                              {asset.asset_details?.date_of_purchase 
                                ? new Date(asset.asset_details.date_of_purchase).toLocaleDateString()
                                : "N/A"
                              }
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                              {new Date(asset.asset_details?.date_disposed || asset.date_added).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                              {asset.asset_details?.disposed_by || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal Footer with Pagination */}
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filterModalAssets(selectedWorkstation.assets).length)} of {filterModalAssets(selectedWorkstation.assets).length} assets
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {getTotalPages(selectedWorkstation.assets)}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages(selectedWorkstation.assets)))}
                        disabled={currentPage === getTotalPages(selectedWorkstation.assets)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      
    </div>
  );
};

export default ArchiveDisposalsPage;
