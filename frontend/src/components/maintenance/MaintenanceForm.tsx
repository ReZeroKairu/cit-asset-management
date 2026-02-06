import React, { useState, useEffect } from "react";

// API Imports
import {
  createMaintenanceReport,
  updateMaintenanceReport,
} from "../../api/maintenance";

import type { MaintenanceReport } from "../../api/maintenance";

import { getAllProcedures, saveReportProcedures } from "../../api/procedures";

import type { Procedure, ReportProcedure } from "../../api/procedures";

import { getUserAssignedLab } from "../../api/dailyReports";
import { getLabWorkstationsForReport } from "../../api/workstationReports";

import { getWorkstationAssets, updateAsset } from "../../api/inventory";

import api from "../../api/axios";
import { Monitor, Cpu, Keyboard, Network } from "lucide-react";

// Local Interface for Table
interface WorkstationAssetItem {
  asset_id: number;
  unit_name: string;
  property_tag_no: string | null;
  asset_remarks: string;
  status: string;
}

// Interface for the "Others" items
interface OtherItem {
  name: string;
  remarks: string;
  status: string;
}

interface Props {
  report?: MaintenanceReport;
  targetWorkstation?: { id: number; name: string } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// System Unit Components List
const SYSTEM_UNIT_TYPES = [
  "SSD",
  "PSU",
  "RAM",
  "CPU",
  "HDD",
  "Case",
  "CPU Fan",
  "Motherboard",
  "System Fan",
  "GPU",
  "Video Card",
];

const MaintenanceForm: React.FC<Props> = ({
  report,
  targetWorkstation,
  onSuccess,
  onCancel,
}) => {
  const getCurrentQuarter = () => {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return "1st";
    if (month <= 6) return "2nd";
    if (month <= 9) return "3rd";
    return "4th";
  };

  const [formData, setFormData] = useState({
    lab_id: report?.lab_id || 0,
    report_date: report?.report_date || new Date().toISOString().split("T")[0],
    quarter: getCurrentQuarter(),
    general_remarks: report?.general_remarks || "",
  });

  const [assignedLab, setAssignedLab] = useState<any>(null);
  const [procedures, setProcedures] = useState<ReportProcedure[]>([]);
  const [workstations, setWorkstations] = useState<any[]>([]);

  const [workstationAssets, setWorkstationAssets] = useState<
    WorkstationAssetItem[]
  >([]);

  // State for "Other" items (Software, Connectivity)
  const [otherItems, setOtherItems] = useState<OtherItem[]>([
    { name: "Software", remarks: "", status: "Functional" },
    { name: "Connectivity Type", remarks: "", status: "Functional" },
    { name: "Connectivity Speed", remarks: "", status: "Functional" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isProcedureDropdownOpen, setIsProcedureDropdownOpen] = useState(false);

  useEffect(() => {
    loadAssignedLab();
    loadProcedures();
    if (report) {
      loadReportProcedures(report.report_id);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProcedureDropdownOpen) {
        const dropdown = document.getElementById("procedure-dropdown");
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsProcedureDropdownOpen(false);
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isProcedureDropdownOpen]);

  useEffect(() => {
    if (targetWorkstation) {
      loadWorkstationAssets(targetWorkstation.id);
    }
  }, [targetWorkstation]);

  useEffect(() => {
    if (formData.lab_id) {
      loadWorkstations(formData.lab_id);
    }
  }, [formData.lab_id, report]);

  const loadWorkstationAssets = async (id: number) => {
    try {
      const data = await getWorkstationAssets(id);
      const mappedAssets = data.map((item: any) => ({
        ...item,
        asset_remarks: item.asset_remarks || item.description || "",
      }));
      setWorkstationAssets(mappedAssets);
    } catch (err) {
      console.error("Failed to load assets", err);
    }
  };

  const handleAssetChange = (
    assetId: number,
    field: keyof WorkstationAssetItem,
    value: string,
  ) => {
    setWorkstationAssets((prev) =>
      prev.map((asset) => {
        if (asset.asset_id === assetId) {
          return { ...asset, [field]: value };
        }
        return asset;
      }),
    );
  };

  const handleOtherItemChange = (
    index: number,
    field: keyof OtherItem,
    value: string,
  ) => {
    setOtherItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const systemAssets = workstationAssets.filter((asset) =>
    SYSTEM_UNIT_TYPES.some(
      (type) => type.toLowerCase() === asset.unit_name.toLowerCase(),
    ),
  );

  const peripheralAssets = workstationAssets.filter(
    (asset) =>
      !SYSTEM_UNIT_TYPES.some(
        (type) => type.toLowerCase() === asset.unit_name.toLowerCase(),
      ),
  );

  const loadProcedures = async () => {
    try {
      const data = await getAllProcedures();
      const qpmcProcedures = data.filter(
        (proc: any) => proc.category === "QPMC",
      );
      setProcedures(
        qpmcProcedures.map((proc: Procedure) => ({
          ...proc,
          overall_status: "Pending",
          overall_remarks: "",
          checklists: [],
        })),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const loadReportProcedures = async (reportId: number) => {
    try {
      const allProcedures = await getAllProcedures();
      const qpmcProcedures = allProcedures.filter(
        (proc: any) => proc.category === "QPMC",
      );
      try {
        const reportData = await api.get(`/maintenance-reports/${reportId}`);
        const savedProcedures = reportData.data.procedures || [];
        const merged = qpmcProcedures.map((proc: Procedure) => {
          const saved = savedProcedures.find(
            (sp: any) => sp.procedure_id === proc.procedure_id,
          );
          return {
            ...proc,
            overall_status: saved ? saved.overall_status : "Pending",
            overall_remarks: saved ? saved.overall_remarks : "",
            checklists: [],
          };
        });
        setProcedures(merged);
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadWorkstations = async (labId: number) => {
    try {
      const data = await getLabWorkstationsForReport(labId, report?.report_id);
      if (targetWorkstation) {
        const updated = data.map((ws: any) => ({
          ...ws,
          checked: ws.workstation_id === targetWorkstation.id,
        }));
        setWorkstations(updated);
      } else {
        setWorkstations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssignedLab = async () => {
    try {
      const data = await getUserAssignedLab();
      setAssignedLab(data.assigned_lab);
      if (data.assigned_lab && !report) {
        setFormData((prev) => ({ ...prev, lab_id: data.assigned_lab.lab_id }));
      }
    } catch (err) {
      setError("Failed to load assigned laboratory");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalRemarks = formData.general_remarks;
      const quarterTag = `[Quarter: ${formData.quarter}]`;
      if (!finalRemarks.includes("[Quarter:")) {
        finalRemarks = `${quarterTag} ${finalRemarks}`;
      }
      const submitData = { ...formData, general_remarks: finalRemarks };

      let createdReport;
      if (report) {
        await updateMaintenanceReport(report.report_id, submitData);
        createdReport = { report_id: report.report_id };
      } else {
        createdReport = await createMaintenanceReport(submitData);
      }

      const otherInfoString = otherItems
        .filter((i) => i.remarks || i.status !== "Functional")
        .map((i) => `[${i.name}: ${i.remarks || i.status}]`)
        .join(" ");

      const checkedWorkstations = workstations.filter((ws) => ws.checked);
      if (checkedWorkstations.length > 0) {
        await api.post(
          `/maintenance-reports/${createdReport.report_id}/workstations`,
          {
            reportId: createdReport.report_id,
            workstations: checkedWorkstations.map((ws) => ({
              workstation_id: ws.workstation_id,
              status: ws.status || "Working",
              remarks: ws.remarks
                ? `${ws.remarks} ${otherInfoString}`
                : otherInfoString,
            })),
          },
        );
      }

      const checkedProcedures = procedures.filter(
        (p) => p.overall_status === "Completed",
      );
      if (checkedProcedures.length > 0) {
        const procData = checkedProcedures.map((proc) => ({
          procedure_id: proc.procedure_id,
          overall_status: proc.overall_status,
          overall_remarks: proc.overall_remarks,
        }));
        await saveReportProcedures(createdReport.report_id, procData);
      }

      if (targetWorkstation && workstationAssets.length > 0) {
        await Promise.all(
          workstationAssets.map((asset) => {
            let statusId = 1;
            if (asset.status === "For Repair") statusId = 2;
            if (asset.status === "Defective") statusId = 3;
            if (asset.status === "Condemned") statusId = 4;
            return updateAsset(asset.asset_id, {
              asset_remarks: asset.asset_remarks,
              description: asset.asset_remarks,
            });
          }),
        );
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to save report");
    } finally {
      setLoading(false);
    }
  };

  const AssetRow = ({ asset }: { asset: WorkstationAssetItem }) => (
    <tr key={asset.asset_id}>
      <td className="px-6 py-4 text-sm font-medium text-gray-900">
        {asset.unit_name}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {asset.property_tag_no}
      </td>
      <td className="px-6 py-4 text-sm">
        <input
          type="text"
          value={asset.asset_remarks || ""}
          onChange={(e) =>
            handleAssetChange(asset.asset_id, "asset_remarks", e.target.value)
          }
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
          placeholder="Remarks..."
        />
      </td>
      <td className="px-6 py-4 text-sm">
        <select
          value={asset.status}
          onChange={(e) =>
            handleAssetChange(asset.asset_id, "status", e.target.value)
          }
          className={`block w-full pl-2 pr-8 py-1 text-sm border-gray-300 rounded-md outline-none ${asset.status === "Functional" || asset.status === "Working" ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}`}
        >
          <option value="Functional">Functional</option>
          <option value="Working">Working</option>
          <option value="For Repair">For Repair</option>
          <option value="Defective">Defective</option>
          <option value="Condemned">Condemned</option>
          <option value="Missing">Missing</option>
        </select>
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">
        {targetWorkstation
          ? `Service: ${targetWorkstation.name}`
          : "New Maintenance Report"}
      </h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lab, Date, Quarter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Laboratory
            </label>
            <input
              type="text"
              disabled
              value={assignedLab?.lab_name || "Loading..."}
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.report_date}
              onChange={(e) =>
                setFormData({ ...formData, report_date: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Service Quarter
            </label>
            <select
              value={formData.quarter}
              onChange={(e) =>
                setFormData({ ...formData, quarter: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="1st">1st Quarter (Jan-Mar)</option>
              <option value="2nd">2nd Quarter (Apr-Jun)</option>
              <option value="3rd">3rd Quarter (Jul-Sep)</option>
              <option value="4th">4th Quarter (Oct-Dec)</option>
            </select>
          </div>
        </div>

        {/* Procedures Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Procedures</h3>
            {procedures.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const allCompleted = procedures.every(
                    (proc) => proc.overall_status === "Completed",
                  );
                  setProcedures(
                    procedures.map((proc) => ({
                      ...proc,
                      overall_status: allCompleted ? "Pending" : "Completed",
                    })),
                  );
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {procedures.every((proc) => proc.overall_status === "Completed")
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div className="relative" id="procedure-dropdown">
              <button
                type="button"
                onClick={() =>
                  setIsProcedureDropdownOpen(!isProcedureDropdownOpen)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left flex justify-between"
              >
                <span className="text-gray-500">
                  {procedures.filter((p) => p.overall_status === "Completed")
                    .length > 0
                    ? `${procedures.filter((p) => p.overall_status === "Completed").length} procedures selected`
                    : "Select procedures..."}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isProcedureDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border shadow-lg max-h-40 overflow-y-auto">
                  {procedures
                    .filter((p) => p.overall_status !== "Completed")
                    .map((proc) => (
                      <button
                        key={proc.procedure_id}
                        type="button"
                        onClick={() => {
                          const updated = procedures.map((p) =>
                            p.procedure_id === proc.procedure_id
                              ? { ...p, overall_status: "Completed" }
                              : p,
                          );
                          setProcedures(updated);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100"
                      >
                        {proc.procedure_name}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {procedures
                .filter((p) => p.overall_status === "Completed")
                .map((proc) => (
                  <div
                    key={proc.procedure_id}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 rounded-full"
                  >
                    <span className="text-sm font-medium text-green-800">
                      {proc.procedure_name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setProcedures(
                          procedures.map((p) =>
                            p.procedure_id === proc.procedure_id
                              ? { ...p, overall_status: "Pending" }
                              : p,
                          ),
                        )
                      }
                      className="text-green-600 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {targetWorkstation && (
          <>
            {/* TABLE 1: SYSTEM UNIT COMPONENTS */}
            <div className="border rounded-md overflow-hidden mb-6">
              <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center">
                <Cpu className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-medium text-blue-900">
                  System Unit Components
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* ✅ ORGANIZED COLUMN WIDTHS */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">
                      Component
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
                  {systemAssets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No system unit components found.
                      </td>
                    </tr>
                  ) : (
                    systemAssets.map((asset) => (
                      <AssetRow key={asset.asset_id} asset={asset} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE 2: PERIPHERALS */}
            <div className="border rounded-md overflow-hidden mb-6">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center">
                <Keyboard className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="font-medium text-gray-900">
                  Peripherals & External Devices
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* ✅ ORGANIZED COLUMN WIDTHS (MATCHING TABLE 1) */}
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
                  {peripheralAssets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No peripheral assets found.
                      </td>
                    </tr>
                  ) : (
                    peripheralAssets.map((asset) => (
                      <AssetRow key={asset.asset_id} asset={asset} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE 3: NETWORK & SOFTWARE (OTHERS) */}
            <div className="border rounded-md overflow-hidden">
              <div className="bg-purple-50 px-4 py-2 border-b border-purple-100 flex items-center">
                <Network className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="font-medium text-purple-900">
                  Network & Software
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* ✅ ORGANIZED COLUMN WIDTHS (MATCHING TABLE 1) */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">
                      Item Name
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
                  {otherItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">N/A</td>
                      <td className="px-6 py-4 text-sm">
                        {/* CONDITIONAL INPUT: If "Connectivity Type", show Checkboxes */}
                        {item.name === "Connectivity Type" ? (
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                checked={item.remarks === "Wired"}
                                onChange={() =>
                                  handleOtherItemChange(
                                    index,
                                    "remarks",
                                    "Wired",
                                  )
                                }
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Wired
                              </span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                checked={item.remarks === "Wireless"}
                                onChange={() =>
                                  handleOtherItemChange(
                                    index,
                                    "remarks",
                                    "Wireless",
                                  )
                                }
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Wireless
                              </span>
                            </label>
                          </div>
                        ) : (
                          // Default Text Input
                          <input
                            type="text"
                            value={item.remarks}
                            onChange={(e) =>
                              handleOtherItemChange(
                                index,
                                "remarks",
                                e.target.value,
                              )
                            }
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-purple-500 outline-none"
                            placeholder="Remarks..."
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleOtherItemChange(
                              index,
                              "status",
                              e.target.value,
                            )
                          }
                          className="block w-full pl-2 pr-8 py-1 text-sm border-gray-300 rounded-md outline-none text-green-700 bg-green-50"
                        >
                          <option value="Functional">Functional</option>
                          <option value="Not Functional">Not Functional</option>
                          <option value="N/A">N/A</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Submit & Update Assets" : "Submit Report"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;
