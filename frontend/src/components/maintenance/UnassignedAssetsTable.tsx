import React from "react";

interface Asset {
  asset_id: number;
  lab_id: number | null;
  workstation_id: number | null;
  unit_id: number | null;
  added_by_user_id: number | null;
  date_added: string;
  asset_details?: {
    detail_id: number;
    property_tag_no: string | null;
    serial_number: string | null;
    description: string | null;
    date_of_purchase: string | null;
    date_disposed: string | null;
    disposed_by: string | null;
    asset_remarks?: string | null;
    status_id: number;
    asset_statuses?: {
      status_name: string;
    };
  };
  laboratories?: {
    lab_name: string;
  };
  workstations?: {
    workstation_name: string;
  };
  units?: {
    unit_name: string;
  };
  users?: {
    full_name: string;
  };
}

interface Props {
  assets: Asset[];
  labName: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

// Helper to determine status color
const getStatusColor = (statusName?: string) => {
  switch (statusName) {
    case "Functional":
    case "Working":
    case "Operational":
      return "bg-green-100 text-green-800";
    case "For Disposal":
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

const UnassignedAssetsTable: React.FC<Props> = ({ 
  assets, 
  labName, 
  searchTerm, 
  onSearchChange 
}) => {
  const filteredAssets = assets.filter(asset =>
    asset.units?.unit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_details?.property_tag_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_details?.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-white flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m8 6-8-6 8 6m0-10V4a2 2 0 00-2-2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V7m-8 4v8m0-4l8 4" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">
            Unassigned Assets - {labName}
          </h3>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Property Tag
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Unit Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Serial Number
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date of Purchase
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {filteredAssets.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {searchTerm 
                    ? "No assets found matching your search."
                    : "No unassigned assets found in your laboratory."}
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr
                  key={asset.asset_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {asset.asset_details?.property_tag_no || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.units?.unit_name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {asset.asset_details?.serial_number || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={asset.asset_details?.description || ""}>
                    {asset.asset_details?.description || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(asset.asset_details?.date_of_purchase)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        asset.asset_details?.asset_statuses?.status_name
                      )}`}
                    >
                      {asset.asset_details?.asset_statuses?.status_name || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[150px] truncate" title={asset.asset_details?.asset_remarks || ""}>
                    {asset.asset_details?.asset_remarks || "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-white px-6 py-4 border-t border-gray-100 text-xs text-gray-400">
        {searchTerm 
          ? `Found ${filteredAssets.length} assets matching "${searchTerm}"`
          : `Showing ${filteredAssets.length} unassigned assets in ${labName}`}
      </div>
    </div>
  );
};

export default UnassignedAssetsTable;
