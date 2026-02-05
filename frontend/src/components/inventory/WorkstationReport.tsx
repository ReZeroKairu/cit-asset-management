//frontend/src/components/inventory/WorkstationReport.tsx
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { generateTemplateReport } from "../../utils/generateTemplateReport";
import { FileDown, Lock } from "lucide-react";

interface WorkstationAsset {
  asset_id: number;
  property_tag_no: string | null;
  serial_number: string | null;
  description: string | null;
  quantity: number | null;
  unit_name: string | null;
  remarks: string | null;
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
  show: boolean;
  onClose: () => void;
}

const WorkstationReport: React.FC<Props> = ({ show, onClose }) => {
  const { user } = useAuth();
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState<string>("");
  const [labs, setLabs] = useState<{ lab_id: number; lab_name: string }[]>([]);

  useEffect(() => {
    if (show && user?.role === "Custodian" && user.lab_id) {
      setSelectedLab(user.lab_id.toString());
    }
  }, [show, user]);

  useEffect(() => {
    if (show) {
      fetchLabs();
      fetchWorkstations();
    }
  }, [show, selectedLab]);

  const fetchLabs = async () => {
    try {
      const response = await api.get("/laboratories");
      setLabs(response.data);
    } catch (error) {
      console.error("Failed to fetch labs:", error);
    }
  };

  const fetchWorkstations = async () => {
    try {
      setLoading(true);
      const endpoint = "/workstations";
      const response = await api.get(endpoint);

      let data: Workstation[] = response.data.map((ws: any) => ({
        workstation_id: ws.workstation_id,
        workstation_name: ws.workstation_name,
        lab_name: ws.laboratory?.lab_name || null,
        location: ws.laboratory?.location || null,
        lab_id: ws.lab_id,
        assets: ws.assets.map((asset: any) => ({
          asset_id: asset.asset_id,
          property_tag_no:
            asset.details?.property_tag_no || asset.property_tag_no,
          serial_number: asset.details?.serial_number || asset.serial_number,
          description: asset.details?.description || asset.description,
          quantity: asset.details?.quantity || asset.quantity,
          unit_name: asset.units?.unit_name,
          remarks: asset.details?.asset_remarks || "",
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
    } catch (error) {
      console.error("Failed to fetch workstations:", error);
    } finally {
      setLoading(false);
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

  const handleDownload = async () => {
    if (workstations.length === 0) return;

    // 1. Prepare dynamic suffixes (Lab Name)
    let labSuffix = "";
    if (selectedLab) {
      const selectedLabObj = labs.find((l) => l.lab_id === Number(selectedLab));
      if (selectedLabObj) {
        labSuffix = ` - ${selectedLabObj.lab_name.trim()}`;
      }
    }

    // 2. Get Current Date & Time
    const now = new Date();

    // A. Format for the Document Content (e.g., "February 3, 2026 - 10:30 AM")
    const reportDateContent = now.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // B. Format for the Filename (Safe characters, e.g., "Feb-03-2026_10-30AM")
    const dateFileStr = now
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .replace(/[\/,\s]/g, "-"); // Replaces slashes/spaces with dashes

    const timeFileStr = now
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/[:\s]/g, ""); // Removes colons and spaces

    const fileName = `LDCU-Forms-CIT-032-Laboratory Equipment Inventory${labSuffix} - ${dateFileStr}_${timeFileStr}.docx`;

    // 3. Structure data for the document
    const structuredWorkstations = workstations.map((ws) => ({
      workstation_name: ws.workstation_name,
      assets: ws.assets.map((asset) => ({
        property_tag: asset.property_tag_no || "N/A",
        serial_number: asset.serial_number || "N/A",
        description: `${asset.unit_name || "Device"} - ${asset.description || ""}`,
        remarks: asset.remarks || "",
      })),
    }));

    const reportData = {
      lab_name: workstations[0]?.lab_name || "Unassigned Laboratory",
      custodian_name: (user?.name || "Unknown Custodian").toUpperCase(),

      // ✅ Updated to include Time and Month Name
      report_date: reportDateContent,

      location: workstations[0]?.location || "Main Campus",
      workstations: structuredWorkstations,
    };

    try {
      await generateTemplateReport(
        "/inventory_template.docx",
        reportData,
        fileName,
      );
    } catch (error) {
      console.error("Download failed:", error);
      alert(
        "Failed to generate report. Please check if the template exists in the public folder.",
      );
    }
  };

  return (
    <>
      {show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b bg-gray-50 rounded-t-md">
              <h3 className="text-xl font-semibold text-gray-900">
                Workstation Inventory Report
              </h3>
              <button
                onClick={handleDownload}
                disabled={loading || workstations.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Download Word Doc
              </button>
            </div>

            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Filter by Lab:
                </label>
                <div className="relative">
                  <select
                    className={`border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-8 ${
                      user?.role === "Custodian"
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-white"
                    }`}
                    value={selectedLab}
                    onChange={(e) => setSelectedLab(e.target.value)}
                    disabled={user?.role === "Custodian"}
                  >
                    <option value="">All Laboratories</option>
                    {labs.map((lab) => (
                      <option key={lab.lab_id} value={lab.lab_id}>
                        {lab.lab_name}
                      </option>
                    ))}
                  </select>
                  {user?.role === "Custodian" && (
                    <Lock className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2" />
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
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
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {workstation.assets.length} Assets
                        </span>
                      </div>

                      {workstation.assets.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 italic text-sm">
                          No assets assigned to this workstation
                        </div>
                      ) : (
                        // ✅ TABLE LAYOUT: Using "table-fixed" for strict sizing
                        <table className="min-w-full table-fixed divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {/* ✅ FIXED WIDTHS: 
                                 These classes force every column to stay the same size 
                                 across all tables.
                              */}
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
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkstationReport;
