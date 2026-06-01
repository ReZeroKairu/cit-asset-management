import React, { useState } from "react";
import { Edit, Trash2 } from "lucide-react";

interface Props {
  assets: any[];
  onEdit: (asset: any) => void;
  onMarkForDisposal: (id: number) => void;
  onBulkDispose?: (assetIds: number[]) => void; // New prop for bulk disposal
  showWorkstationColumn?: boolean; // Only show workstation column for Asset Search
}

const UnassignedAssetTable: React.FC<Props> = ({
  assets,
  onEdit,
  onMarkForDisposal,
  onBulkDispose,
  showWorkstationColumn = false,
}) => {
  const [selectedAssets, setSelectedAssets] = useState<Set<number>>(new Set());

  // Sort assets by workstation (alphabetical with numeric fallback) - only for Asset Search
  const sortedAssets = showWorkstationColumn ? [...assets].sort((a, b) => {
    const getWorkstationSortValue = (asset: any) => {
      const wsName = asset.workstation?.workstation_name || 
                     asset.workstations?.workstation_name || 
                     `WS-${asset.workstation_id}` || 
                     'N/A';
      
      // Extract text prefix and number
      const textMatch = wsName.match(/^([A-Za-z-]+)/);
      const numMatch = wsName.match(/(\d+)/);
      
      const textPrefix = textMatch ? textMatch[1] : '';
      const number = numMatch ? parseInt(numMatch[1]) : 999999;
      
      return { textPrefix, number, original: wsName };
    };
    
    const wsA = getWorkstationSortValue(a);
    const wsB = getWorkstationSortValue(b);
    
    // If text prefixes are the same, compare numbers (most workstations will have same prefix)
    if (wsA.textPrefix === wsB.textPrefix) {
      return wsA.number - wsB.number;
    }
    
    // Otherwise compare text prefixes alphabetically
    return wsA.textPrefix.localeCompare(wsB.textPrefix);
  }) : assets;
  
    return (
    <div className="overflow-x-auto border rounded-lg">
      {selectedAssets.size > 0 && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => onBulkDispose?.(Array.from(selectedAssets))}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center shadow-sm cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Mark for Disposal
            </button>
          </div>
        </div>
      )}
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedAssets.size === sortedAssets.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAssets(new Set(sortedAssets.map(asset => asset.asset_id)));
                  } else {
                    setSelectedAssets(new Set());
                  }
                }}
                className="border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </th>
            {showWorkstationColumn && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workstation
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Property Tag
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Serial No.
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Qty
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedAssets.length === 0 ? (
            <tr>
              <td colSpan={showWorkstationColumn ? 9 : 8} className="px-6 py-4 text-center text-gray-500">
                No unassigned assets found.
              </td>
            </tr>
          ) : (
            sortedAssets.map((asset) => (
              <tr key={asset.asset_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedAssets.has(asset.asset_id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedAssets);
                      if (e.target.checked) {
                        newSelected.add(asset.asset_id);
                      } else {
                        newSelected.delete(asset.asset_id);
                      }
                      setSelectedAssets(newSelected);
                    }}
                    className="border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                {showWorkstationColumn && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      {asset.workstation?.workstation_name || asset.workstations?.workstation_name || `WS-${asset.workstation_id}` || "N/A"}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-semibold">
                  {asset.asset_details?.property_tag_no || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {asset.units?.unit_name || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900"
                    title={asset.asset_details?.description}
                >
                  {asset.asset_details?.description || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {asset.asset_details?.serial_number || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {asset.laboratories?.lab_name || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  1
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-2">
                  <button
                    className="p-2 h-8 w-8 cursor-pointer hover:bg-gray-200 rounded-md text-blue-600 hover:text-blue-700 transition-colors"
                    onClick={() => onEdit(asset)}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="text-orange-600 hover:text-orange-800 cursor-pointer"
                    onClick={() => onMarkForDisposal(asset.asset_id)}
                    title="Mark for Disposal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UnassignedAssetTable;
