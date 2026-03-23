import React, { useState, useEffect } from "react";
import { Edit, Trash2 } from "lucide-react"; // Removed the Eye icon
import { calculateWorstStatus } from "../../utils/statusUtils";
import { getWorkstationAssets } from "../../api/inventory";

interface Props {
  workstations: any[];
  onView: (workstation: any) => void;
  onEdit: (workstation: any) => void;
  onDelete: (id: number) => void;
  getStatusColor: (status?: string) => string;
  pmcReports?: Record<number, any>;
}

const WorkstationTable: React.FC<Props> = ({
  workstations,
  onView,
  onEdit,
  onDelete,
  getStatusColor,
  pmcReports = {},
}) => {
  // Local implementation if not provided
  const defaultGetStatusColor = (status?: string) => {
    switch (status) {
      case "Functional":
      case "Working":
      case "Operational":
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

  const statusColor = getStatusColor || defaultGetStatusColor;
  const [workstationAssets, setWorkstationAssets] = useState<
    Record<number, any[]>
  >({});

  // Load assets for each workstation
  useEffect(() => {
    const loadAssetsForWorkstations = async () => {
      for (const ws of workstations) {
        try {
          const assets = await getWorkstationAssets(ws.workstation_id);
          // Transform assets to have status property
          const transformedAssets = assets.map((asset: any) => ({
            ...asset,
            status:
              asset.details?.current_status?.status_name ||
              asset.status ||
              "Functional",
          }));
          setWorkstationAssets((prev) => ({
            ...prev,
            [ws.workstation_id]: transformedAssets,
          }));
        } catch (error) {
          console.error(
            `Failed to load assets for workstation ${ws.workstation_id}:`,
            error
          );
          setWorkstationAssets((prev) => ({
            ...prev,
            [ws.workstation_id]: [],
          }));
        }
      }
    };

    if (workstations.length > 0) {
      loadAssetsForWorkstations();
    }
  }, [workstations]);

  // Calculate actual status for each workstation
  const getCalculatedStatus = (workstation: any) => {
    const assets = workstationAssets[workstation.workstation_id] || [];
    if (assets.length === 0) {
      return workstation.asset_statuses?.status_name || "Functional";
    }
    return calculateWorstStatus(assets);
  };

  // Get workstation remarks
  const getWorkstationRemarks = (workstation: any) => {
    // First check for workstation remarks
    if (workstation.workstation_remarks) {
      return workstation.workstation_remarks;
    }
    
    // Then check for PMC report overall remarks
    const pmcReport = pmcReports[workstation.workstation_id];
    if (pmcReport?.overall_remarks) {
      return pmcReport.overall_remarks;
    }
    
    return "No remarks";
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Workstation Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Laboratory
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Remarks
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {workstations.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                No workstations found.
              </td>
            </tr>
          ) : (
            workstations.map((workstation) => (
              <tr
                key={workstation.workstation_id}
                onClick={() => onView(workstation)}
                // Added cursor-pointer and group classes to make it feel clickable
                className="hover:bg-blue-50 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Text turns darker blue when the row is hovered */}
                  <span className="font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">
                    {workstation.workstation_name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {workstation.laboratories?.lab_name || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {workstation.laboratories?.location || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor(
                      getCalculatedStatus(workstation)
                    )}`}
                  >
                    {getCalculatedStatus(workstation)}
                  </span>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate"
                  title={getWorkstationRemarks(workstation)}
                >
                  {getWorkstationRemarks(workstation)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-800 p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); // Stops row click from triggering
                      onEdit(workstation);
                    }}
                    title="Edit Workstation"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-100 rounded transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); // Stops row click from triggering
                      onDelete(workstation.workstation_id);
                    }}
                    title="Delete Workstation"
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

export default WorkstationTable;
