import { useState } from "react";
import { Edit, ChevronLeft, ChevronRight } from "lucide-react";

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
  workstation_id?: number;
  workstations?: { workstation_name: string };
  asset_details?: {
    property_tag_no: string;
    item_name: string;
    description: string;
    serial_number: string;
    quantity: number;
    date_of_purchase: string;
    asset_statuses?: {
      status_name: string;
    };
    date_disposed?: string;
    disposed_by?: string;
  };
}

interface SearchAllAssetsTableProps {
  assets: Asset[];
  assetSearch: string;
  setAssetSearch: (value: string) => void;
  selectedLabId: number | null;
  onEdit: (asset: Asset) => void;
  getStatusColor: (statusName?: string) => string;
}

const SearchAllAssetsTable: React.FC<SearchAllAssetsTableProps> = ({
  assets,
  assetSearch,
  setAssetSearch,
  selectedLabId,
  onEdit,
  getStatusColor,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter assets by search and lab
  const filteredAssets = assets.filter((asset) => {
    const searchTerm = assetSearch.toLowerCase();
    const matchesSearch =
      (asset.asset_details?.property_tag_no || "")
        .toLowerCase()
        .includes(searchTerm) ||
      (asset.asset_details?.description || "")
        .toLowerCase()
        .includes(searchTerm) ||
      (asset.asset_details?.serial_number || "")
        .toLowerCase()
        .includes(searchTerm) ||
      (asset.units?.unit_name || "").toLowerCase().includes(searchTerm) ||
      (asset.laboratories?.lab_name || "")
        .toLowerCase()
        .includes(searchTerm) ||
      (asset.workstations?.workstation_name || "")
        .toLowerCase()
        .includes(searchTerm) ||
      (asset.asset_id?.toString() || "").includes(searchTerm);

    const matchesLab = selectedLabId ? asset.lab_id === selectedLabId : true;

    return matchesSearch && matchesLab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          All Assets Search
        </h2>
        <p className="text-sm text-gray-600">
          Showing {filteredAssets.length} of {assets.length} total assets
        </p>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Asset ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Property Tag
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Serial Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Unit Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Laboratory
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Workstation
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date Purchased
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedAssets.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  No assets found matching your search criteria
                </td>
              </tr>
            ) : (
              paginatedAssets.map((asset) => (
                <tr key={asset.asset_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{asset.asset_id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {asset.asset_details?.property_tag_no || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate"
                      title={asset.asset_details?.description}
                  >
                    {asset.asset_details?.description || "No description"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {asset.asset_details?.serial_number || "N/A"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {asset.units?.unit_name || "N/A"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {asset.laboratories?.lab_name || "N/A"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {asset.workstations?.workstation_name || "Unassigned"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        asset.asset_details?.asset_statuses?.status_name
                      )}`}
                    >
                      {asset.asset_details?.asset_statuses?.status_name || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {asset.asset_details?.date_of_purchase
                      ? new Date(asset.asset_details.date_of_purchase).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={() => onEdit(asset)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                      title="Edit Asset"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAssets.length)} of{" "}
              {filteredAssets.length} results
            </div>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page as number)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAllAssetsTable;
