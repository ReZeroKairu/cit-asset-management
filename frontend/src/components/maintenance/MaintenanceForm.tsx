import React, { useState, useEffect } from "react";
import { createPMCReport, getPMCReport } from "../../api/maintenance";
import {
  getAllProcedures,
  type Procedure,
  type ReportProcedure,
} from "../../api/procedures";
import { getUserAssignedLab } from "../../api/dailyReports";
import {
  getWorkstationAssets,
  updateAsset,
  getAssetStatuses,
} from "../../api/inventory";
import { Cpu, Keyboard } from "lucide-react";

import { GeneralInfoSection } from "./form-sections/GeneralInfoSection";
import { ProceduresSection } from "./form-sections/ProceduresSection";
import { AssetTable } from "./form-sections/AssetTable";
import { NetworkTable } from "./form-sections/NetworkTable";

export interface WorkstationAssetItem {
  asset_id: number;
  unit_name: string;
  property_tag_no: string | null;
  asset_remarks: string;
  status: string;
}

interface OtherItem {
  name: string;
  remarks: string;
  status: string;
}

interface Props {
  targetWorkstation: { id: number; name: string } | null;
  selectedQuarter?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const SYSTEM_UNIT_TYPES = [
  "CPU",
  "SSD",
  "PSU",
  "RAM",
  "HDD",
  "Case",
  "CPU Fan",
  "Motherboard",
  "System Fan",
  "GPU",
  "Video Card",
];

const MaintenanceForm: React.FC<Props> = ({
  targetWorkstation,
  selectedQuarter,
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

  const [formData, setFormData] = useState<{
    lab_id: number | null;
    workstation_id: number | null;
    report_date: string;
    quarter: string;
    general_remarks: string;
    workstation_status: string;
  }>({
    lab_id: null,
    workstation_id: null,
    report_date: new Date().toISOString().split("T")[0],
    quarter: selectedQuarter || getCurrentQuarter(),
    general_remarks: "",
    workstation_status: "Functional",
  });

  const [procedures, setProcedures] = useState<ReportProcedure[]>([]);
  const [workstationAssets, setWorkstationAssets] = useState<
    WorkstationAssetItem[]
  >([]);
  const [statusOptions, setStatusOptions] = useState<
    { status_id: number; status_name: string }[]
  >([]);
  const [assignedLab, setAssignedLab] = useState<any>(null);

  const [networkItems, setNetworkItems] = useState<OtherItem[]>([
    { name: "Software", remarks: "", status: "Functional" },
    { name: "Connectivity Type", remarks: "", status: "Functional" },
    { name: "Connectivity Speed", remarks: "", status: "Functional" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAssignedLab();
    loadProcedures();
    loadStatuses();
  }, []);

  useEffect(() => {
    if (targetWorkstation) loadWorkstationAssets(targetWorkstation.id);
  }, [targetWorkstation]);

  // ✅ NEW: Pre-populate Network & Software items and Overall Remarks from existing report
  useEffect(() => {
    if (targetWorkstation) {
      loadExistingReportData(targetWorkstation.id, formData.quarter);
    }
  }, [targetWorkstation, formData.quarter]);

  const loadExistingReportData = async (
    workstationId: number,
    quarter: string,
  ) => {
    try {
      const existingReport = await getPMCReport(workstationId, quarter);
      if (existingReport) {
        // Pre-fill Network & Software items from existing report
        setNetworkItems([
          {
            name: "Software",
            remarks: existingReport.software_name || "",
            status: existingReport.software_status || "Functional",
          },
          {
            name: "Connectivity Type",
            remarks: existingReport.connectivity_type || "",
            status: existingReport.connectivity_type_status || "Functional",
          },
          {
            name: "Connectivity Speed",
            remarks: existingReport.connectivity_speed || "",
            status: existingReport.connectivity_speed_status || "Functional",
          },
        ]);

        // Pre-fill Overall Remarks from existing report
        setFormData((prev) => ({
          ...prev,
          general_remarks: existingReport.overall_remarks || "",
        }));

        // Pre-fill procedures from existing report
        if (existingReport.pmc_report_procedures && existingReport.pmc_report_procedures.length > 0) {
          setProcedures((prev) =>
            prev.map((proc) => {
              const wasCompleted = existingReport.pmc_report_procedures?.some(
                (p: any) =>
                  p.procedures?.procedure_id === proc.procedure_id &&
                  p.is_checked,
              );
              return {
                ...proc,
                overall_status: wasCompleted
                  ? "Completed"
                  : proc.overall_status,
              };
            }),
          );
        }
      }
    } catch (err) {
      // No existing report found — that's fine, use defaults
    }
  };

  const loadAssignedLab = async () => {
    try {
      const data = await getUserAssignedLab();
      setAssignedLab(data.assigned_lab);
      if (data.assigned_lab) {
        setFormData((prev) => ({ ...prev, lab_id: data.assigned_lab.lab_id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const loadStatuses = async () => {
    try {
      const data = await getAssetStatuses();
      // Filter out "Disposed" and "For Disposal" status options
      const filteredStatuses = data.filter(
        (status: any) => 
          status.status_name !== "Disposed" && 
          status.status_name !== "For Disposal"
      );
      setStatusOptions(filteredStatuses);
    } catch (err) {
      console.error(err);
    }
  };

  const loadWorkstationAssets = async (id: number) => {
    try {
      const data = await getWorkstationAssets(id);

      // ✅ FIX: Flatten data for form so it displays correct names
      const mappedAssets = data
        .filter((item: any) => {
          const statusName = item.details?.current_status?.status_name ||
                           item.status ||
                           "Functional";
          return statusName !== "Disposed"; // ✅ Exclude disposed assets
        })
        .map((item: any) => ({
          asset_id: item.asset_id,
          unit_name: item.units?.unit_name || item.unit_name || "Unknown",
          property_tag_no:
            item.details?.property_tag_no || item.property_tag_no || "N/A",
          asset_remarks: item.details?.asset_remarks || item.asset_remarks || "",
          status:
            item.details?.current_status?.status_name ||
            item.status ||
            "Functional",
        }));
      setWorkstationAssets(mappedAssets);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssetChange = (assetId: number, field: string, value: string) => {
    setWorkstationAssets((prev) =>
      prev.map((asset) =>
        asset.asset_id === assetId ? { ...asset, [field]: value } : asset,
      ),
    );
  };

  const handleNetworkChange = (
    index: number,
    field: keyof OtherItem,
    value: string,
  ) => {
    setNetworkItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build asset_actions array
      const asset_actions = workstationAssets.map((asset) => ({
        asset_id: asset.asset_id,
        action: "CHECKED",
        status_before: asset.status,
        status_after: asset.status,
        remarks: asset.asset_remarks || "NONE",
      }));


      const reportPayload = {
        lab_id: formData.lab_id,
        workstation_id: targetWorkstation?.id,
        report_date: formData.report_date,
        quarter: formData.quarter,
        workstation_status: formData.workstation_status, // Let backend determine the actual status
        overall_remarks: formData.general_remarks,
        software_name: networkItems[0].remarks,
        software_status: networkItems[0].status,
        connectivity_type: networkItems[1].remarks,
        connectivity_type_status: networkItems[1].status,
        connectivity_speed: networkItems[2].remarks,
        connectivity_speed_status: networkItems[2].status,
        procedure_ids: procedures
          .filter((p) => p.overall_status === "Completed")
          .map((p) => p.procedure_id),
        service_type: "ROUTINE",
        asset_actions,
      };

      await createPMCReport(reportPayload);

      // ✅ FIX: Added `&& targetWorkstation` to satisfy TypeScript
      if (workstationAssets.length > 0 && targetWorkstation) {
        const assetStatusUpdates = workstationAssets.map((asset) => ({
            asset_id: asset.asset_id,
            unit_name: asset.unit_name,
            new_status: asset.status,
            remarks: asset.asset_remarks || "NONE",
        }));

        await Promise.all(
          workstationAssets.map((asset) => {
            const selectedStatus = statusOptions.find(
              (s) => s.status_name === asset.status,
            );
            const statusId = selectedStatus ? selectedStatus.status_id : 1;
            return updateAsset(asset.asset_id, {
              asset_remarks: asset.asset_remarks,
              status_id: statusId,
              // Keep them assigned securely
              workstation_id: targetWorkstation.id,
              lab_id: formData.lab_id,
            });
          }),
        );

        }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit service report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">
        {targetWorkstation
          ? `Service: ${targetWorkstation.name}`
          : "New QPMC Report"}
      </h2>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <GeneralInfoSection
          labName={assignedLab?.lab_name}
          reportDate={formData.report_date}
          quarter={formData.quarter}
          onDateChange={(date) =>
            setFormData({ ...formData, report_date: date })
          }
          onQuarterChange={(quarter) => setFormData({ ...formData, quarter })}
        />

        <ProceduresSection
          procedures={procedures}
          setProcedures={setProcedures}
        />

        {targetWorkstation && (
          <>
            <AssetTable
              title="System Unit Components"
              icon={<Cpu className="w-5 h-5 text-blue-600" />}
              assets={systemAssets}
              onAssetChange={handleAssetChange}
              emptyMessage="No system unit components found."
              statusOptions={statusOptions}
              isSystemParentIncluded={false}
            />

            <AssetTable
              title="Peripherals & External Devices"
              icon={<Keyboard className="w-5 h-5 text-gray-600" />}
              assets={peripheralAssets}
              onAssetChange={handleAssetChange}
              emptyMessage="No peripheral assets found."
              statusOptions={statusOptions}
              isSystemParentIncluded={false}
            />

            <NetworkTable
              items={networkItems}
              onItemChange={handleNetworkChange}
            />

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Overall Remarks
              </label>
              <textarea
                value={formData.general_remarks}
                onChange={(e) =>
                  setFormData({ ...formData, general_remarks: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter overall workstation remarks..."
              />
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
            {loading ? "Finishing Service..." : "Finish Service"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;
