// frontend/src/components/maintenance/form-sections/AssetTable.tsx

import React from "react";

interface Props {
  title: string;
  icon: React.ReactNode;
  assets: any[];
  onAssetChange: (id: number, field: string, value: string) => void;
  emptyMessage: string;
  statusOptions?: { status_id: number; status_name: string }[];
  isSystemParentIncluded?: boolean;
}

export const AssetTable: React.FC<Props> = ({
  title,
  icon,
  assets,
  onAssetChange,
  emptyMessage,
  statusOptions = [],
  isSystemParentIncluded = false,
}) => {
  return (
    <div className="border rounded-md overflow-hidden mb-6">
      {/* Header Section using title and icon */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center">
        {icon}
        <h3 className="font-medium text-gray-900 ml-2">{title}</h3>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">
              Asset Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5">
              Property Tag
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[35%]">
              Remarks
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[20%]">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assets.length === 0 ? (
            <tr>
              {/* Empty state using emptyMessage */}
              <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            assets.map((asset, index) => {
              // Check if this is the virtual parent row
              const isParentRow = isSystemParentIncluded && index === 0;

              return (
                <tr
                  key={asset.asset_id}
                  className={isParentRow ? "bg-blue-50 font-medium" : ""}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {isParentRow ? (
                      ""
                    ) : (
                      <span className="text-gray-400 mr-2">↳</span>
                    )}
                    {asset.unit_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {asset.property_tag_no || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {isParentRow ? (
                      <span className="text-gray-500 italic text-xs">
                        {asset.asset_remarks}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={asset.asset_remarks || ""}
                        onChange={(e) =>
                          onAssetChange(
                            asset.asset_id,
                            "asset_remarks",
                            e.target.value,
                          )
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
                        placeholder="Remarks..."
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {isParentRow ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          asset.status === "Functional"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        {asset.status}
                      </span>
                    ) : (
                      <select
                        value={asset.status || "Functional"}
                        onChange={(e) =>
                          onAssetChange(
                            asset.asset_id,
                            "status",
                            e.target.value,
                          )
                        }
                        className={`block w-full pl-2 pr-8 py-1 text-sm border-gray-300 rounded-md outline-none ${
                          ["Functional", "Working"].includes(asset.status)
                            ? "text-green-700 bg-green-50"
                            : "text-red-700 bg-red-50"
                        }`}
                      >
                        {statusOptions.length > 0 ? (
                          statusOptions.map((option) => (
                            <option
                              key={option.status_id}
                              value={option.status_name}
                            >
                              {option.status_name}
                            </option>
                          ))
                        ) : (
                          <option value="Functional">Functional</option>
                        )}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
