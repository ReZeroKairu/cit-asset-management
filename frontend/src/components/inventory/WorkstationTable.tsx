import React from "react";
import { Edit, Trash2 } from "lucide-react"; // Removed the Eye icon

interface Props {
  workstations: any[];
  onView: (workstation: any) => void;
  onEdit: (workstation: any) => void;
  onDelete: (id: number) => void;
  getStatusColor: (status?: string) => string;
}

const WorkstationTable: React.FC<Props> = ({
  workstations,
  onView,
  onEdit,
  onDelete,
  getStatusColor,
}) => {
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
                    {workstation.laboratory?.lab_name || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {workstation.laboratory?.location || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      workstation.current_status?.status_name,
                    )}`}
                  >
                    {workstation.current_status?.status_name || "Unknown"}
                  </span>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate"
                  title={workstation.workstation_remarks}
                >
                  {workstation.workstation_remarks || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-800 p-1 hover:bg-gray-200 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation(); // Stops row click from triggering
                      onEdit(workstation);
                    }}
                    title="Edit Workstation"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-100 rounded transition-colors"
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
