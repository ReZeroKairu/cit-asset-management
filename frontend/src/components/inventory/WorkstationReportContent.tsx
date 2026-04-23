//frontend/src/components/inventory/WorkstationReportContent.tsx
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface WorkstationAsset {
  asset_id: number;
  property_tag_no: string | null;
  serial_number: string | null;
  description: string | null;
  quantity: number | null;
  unit_name: string | null;
  remarks: string | null;
  status: string | null;
  asset_details?: {
    asset_details?: {
      asset_statuses?: {
        status_name: string;
      };
    };
  };
}

interface Workstation {
  workstation_id: number;
  workstation_name: string;
  lab_name: string | null;
  location: string | null;
  lab_id: number;
  assets: WorkstationAsset[];
}

interface Props {
  selectedLab: string;
  onLoadingChange: (loading: boolean) => void;
  onWorkstationsChange: (workstations: Workstation[]) => void;
}

const WorkstationReportContent: React.FC<Props> = ({
  selectedLab,
  onLoadingChange,
  onWorkstationsChange,
}) => {
  const { user } = useAuth();
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLab && user?.role === "Custodian" && user.lab_id) {
      // For custodians, ensure they can only see their lab
      if (selectedLab !== user.lab_id.toString()) {
        setWorkstations([]);
        onWorkstationsChange([]);
        return;
      }
    }
  }, [selectedLab, user, onWorkstationsChange]);

  useEffect(() => {
    fetchWorkstations();
  }, [selectedLab]);

  const fetchWorkstations = async () => {
    try {
      setLoading(true);
      onLoadingChange(true);
      // Use a specific endpoint that ensures assets are included
      const endpoint = "/workstations?include_assets=true";
      const response = await api.get(endpoint);

      let data: Workstation[] = response.data.map((ws: any) => ({
        workstation_id: ws.workstation_id,
        workstation_name: ws.workstation_name,
        lab_name: ws.laboratories?.lab_name || null,
        location: ws.laboratories?.location || null,
        lab_id: ws.lab_id,
        assets: (ws.inventory_assets || [])
          .filter((asset: any) => {
            const statusName = asset.asset_details?.asset_statuses?.status_name || 
                              asset.asset_details?.status_id === 6 ? "Disposed" :
                              asset.asset_details?.status_id === 2 ? "For Disposal" :
                              asset.asset_details?.status_id === 3 ? "For Upgrade" :
                              asset.asset_details?.status_id === 4 ? "For Replacement" :
                              asset.asset_details?.status_id === 5 ? "Lost" :
                              asset.asset_details?.status_id === 1 ? "Functional" :
                              "Available";
            return statusName !== "Disposed";
          })
          .map((asset: any) => ({
            asset_id: asset.asset_id,
            property_tag_no:
              asset.asset_details?.property_tag_no || asset.property_tag_no,
            serial_number: asset.asset_details?.serial_number || asset.serial_number,
            description: asset.asset_details?.description || asset.description,
            quantity: asset.asset_details?.quantity || asset.quantity,
            unit_name: asset.units?.unit_name,
            remarks: asset.asset_details?.asset_remarks || "",
            status: asset.asset_details?.asset_statuses?.status_name || 
                     asset.asset_details?.status_id === 6 ? "Disposed" :
                     asset.asset_details?.status_id === 2 ? "For Disposal" :
                     asset.asset_details?.status_id === 3 ? "For Upgrade" :
                     asset.asset_details?.status_id === 4 ? "For Replacement" :
                     asset.asset_details?.status_id === 5 ? "Lost" :
                     asset.asset_details?.status_id === 1 ? "Functional" :
                     "Available",
            asset_details: asset.asset_details,
          })),
      }));

      data.sort((a, b) =>
        a.workstation_name.localeCompare(b.workstation_name, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

      if (selectedLab) {
        data = data.filter((ws: any) => ws.lab_id === Number(selectedLab));
      }

      setWorkstations(data);
      onWorkstationsChange(data);
    } catch (error) {
      console.error("Failed to fetch workstations:", error);
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const getTotalAssets = () => {
    return workstations.reduce((sum, ws) => sum + ws.assets.length, 0);
  };

  const getTotalQuantity = () => {
    return workstations.reduce((sum, ws) => {
      return (
        sum + ws.assets.reduce((aSum, asset) => aSum + (asset.quantity || 0), 0)
      );
    }, 0);
  };

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading report data...</p>
        </div>
      ) : workstations.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
          No workstations found for the selected criteria.
        </div>
      ) : (
        workstations.map((workstation) => (
          <div
            key={workstation.workstation_id}
            className="border rounded-lg overflow-hidden shadow-sm"
          >
            <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
              <div>
                <span className="font-bold text-lg text-gray-800">
                  {workstation.workstation_name}
                </span>
                <span className="text-gray-500 text-sm ml-2">
                  ({workstation.lab_name || "Unassigned"} -{" "}
                  {workstation.location || "No Location"})
                </span>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {workstation.assets.length} Assets
              </span>
            </div>

            {workstation.assets.length === 0 ? (
              <div className="p-4 text-center text-gray-400 italic text-sm">
                No assets assigned to this workstation
              </div>
            ) : (
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">
                      Property Tag
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">
                      Serial No.
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">
                      Unit
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[30%]">
                      Description
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[20%]">
                      Remarks
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[5%]">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workstation.assets.map((asset) => (
                    <tr
                      key={asset.asset_id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 text-sm font-medium text-blue-600 truncate">
                        {asset.property_tag_no || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 truncate">
                        {asset.serial_number || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 truncate">
                        {asset.unit_name || "-"}
                      </td>
                      <td
                        className="px-4 py-2 text-sm text-gray-500 truncate"
                        title={asset.description || ""}
                      >
                        {asset.description || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 truncate">
                        {asset.remarks || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 truncate">
                        {asset.status || "Available"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {asset.quantity || 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))
      )}

      {!loading && workstations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <h4 className="font-bold text-blue-900 mb-2">
            Report Summary
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border border-blue-100">
              <span className="text-gray-500 block">
                Total Workstations
              </span>
              <span className="text-xl font-bold text-blue-600">
                {workstations.length}
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-blue-100">
              <span className="text-gray-500 block">
                Total Assets
              </span>
              <span className="text-xl font-bold text-blue-600">
                {getTotalAssets()}
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-blue-100">
              <span className="text-gray-500 block">
                Total Quantity
              </span>
              <span className="text-xl font-bold text-blue-600">
                {getTotalQuantity()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkstationReportContent;
