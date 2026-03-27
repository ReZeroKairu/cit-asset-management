import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, Monitor, Cpu, Package } from 'lucide-react';
import { getInventory, updateAsset } from '@/api/inventory';
import DisposalConfirmationModal from './DisposalConfirmationModal';

interface Asset {
  asset_id: number;
  lab_id?: number;
  workstation_id?: number;
  unit_id?: number;
  added_by_user_id?: number;
  date_added?: string;
  property_tag_no?: string;
  item_name?: string;
  description?: string;
  serial_number?: string;
  quantity?: number;
  date_of_purchase?: string;
  laboratories?: { lab_id: number; lab_name: string; location?: string };
  units?: { unit_name: string };
  workstation?: { workstation_name: string };
  workstations?: {
    workstation_name: string;
  };
  asset_details?: {
    detail_id?: number;
    property_tag_no?: string;
    serial_number?: string;
    description?: string;
    date_of_purchase?: string;
    date_disposed?: string;
    asset_remarks?: string;
    status_id?: number;
    asset_statuses?: {
      status_name: string;
    };
  };
}

interface DisposalAsset extends Asset {
  daysUntilDisposal?: number;
}

interface ForDisposalToggleProps {
  onDisposalSuccess?: () => void;
}

export default function ForDisposalToggle({ onDisposalSuccess }: ForDisposalToggleProps) {
  const [disposalAssets, setDisposalAssets] = useState<DisposalAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorkstation, setSelectedWorkstation] = useState<{ name: string; assets: DisposalAsset[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWorkstations, setSelectedWorkstations] = useState<string[]>([]);
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const itemsPerPage = 10;

  // Calculate days until recommended disposal
  const calculateDaysUntilDisposal = (asset: Asset): number => {
    if (!asset.asset_details?.date_of_purchase) return 0;
    
    const purchaseDate = new Date(asset.asset_details.date_of_purchase);
    const today = new Date();
    const ageInDays = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Recommend disposal after 5 years (1825 days)
    const recommendedDisposalAge = 1825;
    return Math.max(0, recommendedDisposalAge - ageInDays);
  };

  // Group assets by workstation
  const groupAssetsByWorkstation = (assets: DisposalAsset[]) => {
    const grouped: Record<string, DisposalAsset[]> = {};
    
    assets.forEach(asset => {
      const workstationName = asset.workstations?.workstation_name || 'Unassigned';
      if (!grouped[workstationName]) {
        grouped[workstationName] = [];
      }
      grouped[workstationName].push(asset);
    });
    
    return grouped;
  };

  // Calculate status for workstation group
  const getWorkstationStatus = (assets: DisposalAsset[]) => {
    if (assets.length === 0) return 'Functional';
    
    // Check if any asset is "For Disposal" - that's the worst status
    const hasForDisposal = assets.some(asset => 
      asset.asset_details?.asset_statuses?.status_name === 'For Disposal'
    );
    
    // Check if any asset is "For Repair"
    const hasForRepair = assets.some(asset => 
      asset.asset_details?.asset_statuses?.status_name === 'For Repair'
    );
    
    if (hasForDisposal) return 'For Disposal';
    if (hasForRepair) return 'For Repair';
    return 'Functional';
  };

  // Handle row click to open modal
  const handleRowClick = (workstationName: string, assets: DisposalAsset[]) => {
    setSelectedWorkstation({ name: workstationName, assets });
    setCurrentPage(1);
    setSearchTerm("");
  };

  // Close modal
  const closeModal = () => {
    setSelectedWorkstation(null);
    setCurrentPage(1);
    setSearchTerm("");
  };

  // Handle workstation checkbox selection
  const handleWorkstationCheckboxChange = (workstationName: string, checked: boolean) => {
    if (checked) {
      setSelectedWorkstations(prev => [...prev, workstationName]);
    } else {
      setSelectedWorkstations(prev => prev.filter(name => name !== workstationName));
    }
  };

  // Handle select all workstations
  const handleSelectAllWorkstations = (checked: boolean) => {
    const allWorkstationNames = workstationEntries.map(([name]) => name);
    setSelectedWorkstations(checked ? allWorkstationNames : []);
  };

  // Handle dispose selected workstations
  const handleDisposeSelectedWorkstations = () => {
    // Show confirmation modal instead of direct disposal
    setShowDisposalModal(true);
  };

  // Handle confirmation of disposal
  const handleConfirmDisposal = async (disposedBy: string) => {
    try {
      console.log('🔍 Starting disposal process...');
      
      // Test API connection first
      try {
        const testResponse = await fetch('/api/health', { method: 'GET' });
        console.log('🔍 API Health check:', testResponse.status);
      } catch (healthError) {
        console.error('❌ API Health check failed:', healthError);
      }
      
      // Get all assets from selected workstations
      const allSelectedAssets: DisposalAsset[] = [];
      selectedWorkstations.forEach(workstationName => {
        const workstationAssets = groupedAssets[workstationName] || [];
        allSelectedAssets.push(...workstationAssets);
      });
      
      console.log('🔍 Assets to dispose:', allSelectedAssets.length);
      
      if (allSelectedAssets.length === 0) {
        alert("No assets found in selected workstations to dispose.");
        setShowDisposalModal(false);
        return;
      }
      
      // Update each asset's status to 'Disposed' (status_id = 6) and set disposed_by
      const updatePromises = allSelectedAssets.map(async (asset: DisposalAsset) => {
        try {
          console.log(`🔍 Updating asset ${asset.asset_id} with status_id: 6, disposed_by: ${disposedBy}`);
          const updateData = {
            status_id: 6, // 'Disposed' status
            disposed_by: disposedBy
          };
          console.log('🔍 Sending update data:', updateData);
          
          // Try direct fetch as backup
          try {
            const token = localStorage.getItem("token");
            // Use the same base URL as axios
            const baseURL = window.location.hostname.includes('172.72.102.4') 
              ? "http://172.72.102.4:3001" 
              : "http://localhost:3001";
            
            const directResponse = await fetch(`${baseURL}/inventory/${asset.asset_id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(updateData)
            });
            
            console.log('🔍 Direct fetch response status:', directResponse.status);
            const directResult = await directResponse.json();
            console.log('🔍 Direct fetch result:', directResult);
            
            // Check if the response actually contains the updated status
            console.log('🔍 Direct fetch result asset_details:', directResult.asset_details);
            console.log('🔍 Direct fetch result status:', directResult.asset_details?.asset_statuses?.status_name);
            
            if (directResponse.ok) {
              return directResult;
            } else {
              throw new Error(`Direct fetch failed: ${directResponse.status}`);
            }
          } catch (directError) {
            console.error('❌ Direct fetch failed:', directError);
            
            // Fall back to axios
            const result = await updateAsset(asset.asset_id, updateData);
            console.log(`🔍 Axios update result for asset ${asset.asset_id}:`, result);
            return result;
          }
        } catch (error) {
          console.error(`❌ Failed to update asset ${asset.asset_id}:`, error);
          throw error;
        }
      });
      
      const results = await Promise.all(updatePromises);
      console.log('🔍 All update results:', results);
      
      // Refresh data to show updated status
      await fetchDisposalAssets();
      
      console.log(`Successfully disposed ${allSelectedAssets.length} assets from ${selectedWorkstations.length} workstations by ${disposedBy}`);
      
      // Clear selection after successful disposal
      setSelectedWorkstations([]);
      
      // Notify parent to refresh its data
      if (onDisposalSuccess) {
        onDisposalSuccess();
      }
    } catch (err: any) {
      console.error("❌ Failed to dispose workstation assets:", err);
      console.error("❌ Error details:", err.response?.data);
      alert(err.response?.data?.error || "Failed to dispose workstation assets");
    } finally {
      setShowDisposalModal(false);
    }
  };

  // Check if all workstations are selected
  const areAllWorkstationsSelected = () => {
    return workstationEntries.length > 0 && workstationEntries.every(([name]) => selectedWorkstations.includes(name));
  };

  // Check if any workstations are selected
  const hasSelectedWorkstations = selectedWorkstations.length > 0;

  // Get unit icon
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

  // Filter assets based on search
  const filterAssets = (assets: DisposalAsset[]) => {
    return assets.filter(asset => {
      const searchMatch = searchTerm === "" || 
        asset.asset_id?.toString().includes(searchTerm.toLowerCase()) ||
        asset.asset_details?.property_tag_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_details?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_details?.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.units?.unit_name?.toLowerCase().includes(searchTerm.toLowerCase());
      return searchMatch;
    });
  };

  // Get paginated assets
  const getPaginatedAssets = (assets: DisposalAsset[]) => {
    const filteredAssets = filterAssets(assets);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAssets.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = (assets: DisposalAsset[]) => {
    const filteredAssets = filterAssets(assets);
    return Math.ceil(filteredAssets.length / itemsPerPage);
  };

  // Get disposal count for workstation
  const getDisposalCount = (assets: DisposalAsset[]) => {
    return assets.filter(asset => 
      asset.asset_details?.asset_statuses?.status_name === 'For Disposal' ||
      asset.asset_details?.asset_statuses?.status_name === 'For Repair'
    ).length;
  };

  const fetchDisposalAssets = async () => {
    setLoading(true);
    try {
      const allAssets = await getInventory(); // Direct response, not response.data
      
      console.log('🔍 DEBUG: All assets:', allAssets);
      console.log('🔍 DEBUG: Total assets count:', allAssets.length);
      
      // Debug: Check assets with status details
      const assetsWithStatus = allAssets.filter((asset: Asset) => 
        asset.asset_details?.asset_statuses?.status_name
      );
      console.log('🔍 DEBUG: Assets with status:', assetsWithStatus.length);
      
      // Debug: Check specific status values
      const statusNames = allAssets.map((asset: Asset) => 
        asset.asset_details?.asset_statuses?.status_name
      ).filter(Boolean);
      console.log('🔍 DEBUG: All status names found:', [...new Set(statusNames)]);
      
      // Filter assets with "For Repair" or "For Disposal" status
      const filteredAssets = allAssets
        .filter((asset: Asset) => {
          const statusName = asset.asset_details?.asset_statuses?.status_name; // Fixed: asset_statuses not status
          const matches = statusName === 'For Repair' || statusName === 'For Disposal';
          if (matches) {
            console.log('✅ Found disposal asset:', asset.asset_id, statusName, asset);
          }
          return matches;
        })
        .map((asset: Asset) => ({
          ...asset,
          daysUntilDisposal: calculateDaysUntilDisposal(asset)
        }));

      console.log('🔍 DEBUG: Filtered disposal assets:', filteredAssets.length);
      console.log('🔍 DEBUG: Filtered assets:', filteredAssets);

      setDisposalAssets(filteredAssets);
    } catch (error) {
      console.error('❌ Error fetching disposal assets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisposalAssets();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'For Disposal': return 'bg-red-100 text-red-800';
      case 'For Repair': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  // Group the assets
  const groupedAssets = groupAssetsByWorkstation(disposalAssets);
  const workstationEntries = Object.entries(groupedAssets);

  return (
    <div className="space-y-6">
      {/* Disposal Assets Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Workstations with Assets for Disposal
              <span className="text-sm font-normal text-gray-500">
                ({disposalAssets.length} assets)
              </span>
            </CardTitle>
            {hasSelectedWorkstations && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-800">
                  {selectedWorkstations.length} workstation{selectedWorkstations.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleDisposeSelectedWorkstations}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  Dispose Selected
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading disposal assets...
            </div>
          ) : workstationEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trash2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No assets for disposal</p>
              <p className="text-sm">No assets are currently marked for replacement or disposal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={areAllWorkstationsSelected()}
                        onChange={(e) => handleSelectAllWorkstations(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workstation Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Laboratory
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      For Disposal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workstationEntries.map(([workstationName, assets]) => {
                    const firstAsset = assets[0];
                    const status = getWorkstationStatus(assets);
                    const disposalCount = getDisposalCount(assets);
                    
                    return (
                      <tr
                        key={workstationName}
                        className="hover:bg-blue-50 cursor-pointer transition-colors group"
                        onClick={() => handleRowClick(workstationName, assets)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              handleWorkstationCheckboxChange(workstationName, !selectedWorkstations.includes(workstationName));
                            }}
                            className="inline-block"
                          >
                            <input
                              type="checkbox"
                              checked={selectedWorkstations.includes(workstationName)}
                              onChange={() => {}}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">
                            {workstationName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {firstAsset?.laboratories?.lab_name || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {firstAsset?.laboratories?.location || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Badge className="bg-red-100 text-red-800">
                            {disposalCount} asset{disposalCount !== 1 ? 's' : ''}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assets Modal */}
      {selectedWorkstation && createPortal(
        <>
          {/* Modal Backdrop */}
          <div 
            className="fixed inset-0 backdrop-blur-md bg-black/20 z-9999"
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
                      Assets for Disposal - {selectedWorkstation.name}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {filterAssets(selectedWorkstation.assets).length} assets found
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
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getPaginatedAssets(selectedWorkstation.assets).map((asset: DisposalAsset) => (
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
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.asset_details?.asset_statuses?.status_name || '')}`}>
                                {asset.asset_details?.asset_statuses?.status_name}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                              {asset.asset_details?.date_of_purchase 
                                ? new Date(asset.asset_details.date_of_purchase).toLocaleDateString()
                                : "N/A"
                              }
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filterAssets(selectedWorkstation.assets).length)} of {filterAssets(selectedWorkstation.assets).length} assets
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

      {/* Disposal Confirmation Modal */}
      <DisposalConfirmationModal
        show={showDisposalModal}
        onClose={() => setShowDisposalModal(false)}
        onConfirm={handleConfirmDisposal}
        assetCount={selectedWorkstations.reduce((total, workstationName) => {
          return total + (groupedAssets[workstationName]?.length || 0);
        }, 0)}
      />
    </div>
  );
}
