import React, { useState, useEffect, useCallback } from "react";
import { getPMCReport, getServiceHistory } from "../../api/maintenance";
import { getWorkstationAssets, getAssetStatuses } from "../../api/inventory";
import { useAuth } from "../../context/AuthContext";
import {
  Monitor,
  Calendar,
  CheckCircle2,
  Wrench,
  ListChecks,
  Cpu,
  Keyboard,
  Network,
  AlignLeft,
  Download,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { generateQPMCReport } from "../../utils/reportGenerator";
import ServiceHistoryTimeline from "./ServiceHistoryTimeline";
import RepairModal from "./RepairModal";

interface Props {
  workstation: { id: number; name: string; lab_name?: string };
  quarter: string;
  onService: () => void;
  onBack: () => void;
}

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

const MaintenanceView: React.FC<Props> = ({
  workstation,
  quarter,
  onService,
  onBack,
}) => {
  const { user } = useAuth();
  const [pmcReport, setPmcReport] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [serviceLogs, setServiceLogs] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showServiceHistory, setShowServiceHistory] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const assetData = await getWorkstationAssets(workstation.id);

      const formattedAssets = assetData.map((item: any) => ({
        asset_id: item.asset_id,
        unit_name: item.units?.unit_name || item.unit_name || "Unknown",
        property_tag_no:
          item.details?.property_tag_no || item.property_tag_no || "N/A",
        asset_remarks: item.details?.asset_remarks || item.asset_remarks || "",
        status:
          item.details?.current_status?.status_name ||
          item.status ||
          "Functional",
        description: item.details?.description || item.description || "",
      }));
      setAssets(formattedAssets);

      const reportData = await getPMCReport(workstation.id, quarter);
      setPmcReport(reportData);

      // Fetch service history
      const historyData = await getServiceHistory(workstation.id, quarter);
      setServiceLogs(historyData);

      // Fetch status options
      const statuses = await getAssetStatuses();
      setStatusOptions(statuses);
    } catch (error) {
      console.error("Failed to load details", error);
      setPmcReport(null);
      setServiceLogs([]);
    } finally {
      setLoading(false);
    }
  }, [workstation.id, quarter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- REPORT GENERATION HANDLER ---
  const handleDownloadReport = () => {
    if (!pmcReport) return;

    // 1. Format the Database Report Date (e.g., "February 13, 2026")
    const reportDate = new Date(pmcReport.report_date);
    const formattedDate = reportDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // 2. Get the ACTUAL Current Time right now for the report generation
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const completedProcedures = pmcReport.procedures || [];

    // 1. Map Procedures to Checkmarks
    const checkProc = (name: string) =>
      completedProcedures.some((p: any) => p.procedure.procedure_name === name)
        ? "☑"
        : "☐";

    // 2. Map Statuses to Table Checkmarks
    const mapStatus = (status: string) => ({
      func: ["Functional", "Working", "Operational"].includes(status)
        ? "✓"
        : "",
      rep: status === "For Repair" ? "✓" : "",
      upg: status === "For Upgrade" ? "✓" : "",
      repl: status === "For Replacement" ? "✓" : "",
    });

    // 3. Separate Assets into Peripherals and System Components
    const systemComponents = assets.filter((asset) =>
      SYSTEM_UNIT_TYPES.some(
        (type) => type.toLowerCase() === asset.unit_name.toLowerCase(),
      ),
    );
    const peripheralComponents = assets.filter(
      (asset) =>
        !SYSTEM_UNIT_TYPES.some(
          (type) => type.toLowerCase() === asset.unit_name.toLowerCase(),
        ),
    );

    // 4. Start building the list with Peripherals first
    const componentsList = peripheralComponents.map((asset) => ({
      name: asset.unit_name,
      ...mapStatus(asset.status),
      tag: asset.property_tag_no || "N/A",
      remarks: asset.asset_remarks || "",
    }));

    // 5. Add the "System Unit" Parent row
    const isAllFunctional =
      systemComponents.length > 0 &&
      systemComponents.every((asset) =>
        ["Functional", "Working", "Operational"].includes(asset.status),
      );

    componentsList.push({
      name: "System Unit",
      ...mapStatus(pmcReport.workstation_status),
      tag: "N/A",
      remarks: isAllFunctional ? "Functional" : "",
    });

    // 6. Add the System Unit Components right under it
    systemComponents.forEach((asset) => {
      componentsList.push({
        name: `   ↳ ${asset.unit_name}`,
        ...mapStatus(asset.status),
        tag: asset.property_tag_no || "N/A",
        remarks: asset.asset_remarks || "",
      });
    });

    // 7. Add Software & Network Items explicitly at the bottom
    componentsList.push({
      name: "Software",
      ...mapStatus(pmcReport.software_status),
      tag: "N/A",
      remarks: pmcReport.software_name || "",
    });

    const connTypeStr =
      pmcReport.connectivity_type === "Wired"
        ? "☑ Wired   ☐ Wireless"
        : pmcReport.connectivity_type === "Wireless"
          ? "☐ Wired   ☑ Wireless"
          : "☐ Wired   ☐ Wireless";

    componentsList.push({
      name: "Connectivity Type",
      ...mapStatus(pmcReport.connectivity_type_status),
      tag: "N/A",
      remarks: connTypeStr,
    });

    componentsList.push({
      name: "Connectivity Speed",
      ...mapStatus(pmcReport.connectivity_speed_status),
      tag: "N/A",
      remarks: pmcReport.connectivity_speed || "",
    });

    const rawCustodianName =
      pmcReport?.user?.full_name ||
      (user as any)?.full_name ||
      (user as any)?.name ||
      (user as any)?.fullName ||
      "YOUR NAME HERE";

    // 4. Construct Final Payload
    const templateData = {
      date: formattedDate,
      time: formattedTime,
      lab: workstation.lab_name || "N/A",
      workstation: workstation.name,
      hw_main: checkProc("Hardware Maintenance"),
      sw_main: checkProc("Software Maintenance"),
      sec_main: checkProc("Security Maintenance"),
      net_main: checkProc("Network Maintenance"),
      sys_perf: checkProc("System Performance"),
      reg_clean: checkProc("Regular Cleaning"),
      components: componentsList,
      overall_remarks: pmcReport.overall_remarks || "N/A",
      custodian: rawCustodianName.toUpperCase(),
    };

    // Trigger Download
    generateQPMCReport(templateData);
  };

  // --- Data Processing ---
  const systemAssets = assets.filter((asset) =>
    SYSTEM_UNIT_TYPES.some(
      (type) => type.toLowerCase() === asset.unit_name.toLowerCase(),
    ),
  );
  const peripheralAssets = assets.filter(
    (asset) =>
      !SYSTEM_UNIT_TYPES.some(
        (type) => type.toLowerCase() === asset.unit_name.toLowerCase(),
      ),
  );

  const allSystemFunctional = systemAssets.every((asset) =>
    ["Functional", "Working", "Operational"].includes(asset.status),
  );
  const parentSystemUnit = {
    asset_id: -1,
    unit_name: "System Unit (Overall)",
    property_tag_no: "-",
    description: "Auto-calculated based on components",
    status: allSystemFunctional ? "Functional" : "For Repair",
  };
  const displaySystemAssets =
    systemAssets.length > 0 ? [parentSystemUnit, ...systemAssets] : [];

  const networkItems = [
    {
      name: "Software",
      value: pmcReport?.software_name || "N/A",
      status: pmcReport?.software_status || "N/A",
    },
    {
      name: "Connectivity Type",
      value: pmcReport?.connectivity_type || "N/A",
      status: pmcReport?.connectivity_type_status || "N/A",
    },
    {
      name: "Connectivity Speed",
      value: pmcReport?.connectivity_speed || "N/A",
      status: pmcReport?.connectivity_speed_status || "N/A",
    },
  ];

  const completedProcedures = pmcReport?.procedures || [];

  const ReadOnlyTable = ({
    title,
    icon,
    items,
    emptyMsg,
    isNetwork = false,
    isSystemParentIncluded = false,
  }: any) => (
    <div className="border rounded-md overflow-hidden shadow-sm bg-white">
      <div
        className={`px-4 py-3 border-b flex items-center ${isNetwork ? "bg-purple-50 border-purple-100" : "bg-gray-50 border-gray-200"}`}
      >
        {icon}
        <h3
          className={`font-medium ml-2 ${isNetwork ? "text-purple-900" : "text-gray-900"}`}
        >
          {title}
        </h3>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase w-1/4">
              {isNetwork ? "Item Name" : "Asset"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase w-1/5">
              Property Tag
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase w-[35%]">
              Remarks
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase w-[20%]">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-6 py-6 text-center text-sm text-gray-500"
              >
                {emptyMsg}
              </td>
            </tr>
          ) : (
            items.map((item: any, idx: number) => {
              const isParentRow = isSystemParentIncluded && idx === 0;
              return (
                <tr
                  key={item.asset_id || idx}
                  className={`transition-colors ${isParentRow ? "bg-blue-50 font-medium border-b border-blue-100" : "hover:bg-gray-50"}`}
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {isSystemParentIncluded && !isParentRow && (
                      <span className="text-gray-400 mr-2">↳</span>
                    )}
                    {item.unit_name || item.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {item.property_tag_no || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {isNetwork ? (
                      item.value !== "N/A" ? (
                        item.value
                      ) : (
                        "-"
                      )
                    ) : isParentRow ? (
                      <span className="italic text-xs text-gray-500">
                        {item.description}
                      </span>
                    ) : (
                      item.asset_remarks || item.description || "-"
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${["Functional", "Working", "Operational"].includes(item.status) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading)
    return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-8 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Monitor className="w-6 h-6 mr-2 text-blue-600" />
            {workstation.name}
          </h2>
          <p className="text-gray-500 mt-1">
            {workstation.lab_name || "Laboratory Workstation"}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </button>
          <button
            onClick={onService}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center shadow-sm"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Service Workstation
          </button>

          {/* Repair Component Button (Only shows if report exists) */}
          {pmcReport && (
            <button
              onClick={() => setShowRepairModal(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center shadow-sm"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Repair Component
            </button>
          )}

          {/* Download Report Button (Only shows if report exists) */}
          {pmcReport && (
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              QPMC Report
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 h-fit">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Maintenance Period
          </h3>
          <p className="text-lg font-semibold text-gray-900">
            {quarter} Quarter
          </p>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-1.5" />
            {pmcReport
              ? new Date(pmcReport.report_date).toLocaleDateString()
              : "Not yet serviced"}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 h-fit">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Workstation Status
          </h3>
          {pmcReport ? (
            <>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${pmcReport.workstation_status === "For Repair" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
              >
                {pmcReport.workstation_status}
              </span>
              {pmcReport.service_count > 1 && (
                <p className="text-xs text-gray-600 mt-2">
                  Serviced {pmcReport.service_count} times this quarter
                </p>
              )}
            </>
          ) : (
            <span className="text-gray-500 italic">Pending Maintenance</span>
          )}
        </div>
      </div>

      {/* Service History Section — Collapsible */}
      {serviceLogs.length > 0 && (
        <div className="mb-8">
          <div className="border rounded-md overflow-hidden shadow-sm bg-white">
            <button
              type="button"
              onClick={() => setShowServiceHistory(!showServiceHistory)}
              className="w-full bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-100 transition-colors"
            >
              <div className="flex items-center">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="font-medium text-indigo-900 ml-2">
                  Service History
                </h3>
                <span className="ml-2 text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                  {serviceLogs.length}{" "}
                  {serviceLogs.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              {showServiceHistory ? (
                <ChevronUp className="w-5 h-5 text-indigo-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-indigo-600" />
              )}
            </button>
            {showServiceHistory && (
              <div className="p-6">
                <ServiceHistoryTimeline logs={serviceLogs} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Procedures Card */}
        <div className="border rounded-md overflow-hidden shadow-sm bg-white">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center">
            <ListChecks className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-900 ml-2">
              Completed Procedures
            </h3>
          </div>
          <div className="p-4">
            {completedProcedures.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">
                No procedures recorded.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {completedProcedures.map((p: any) => (
                  <div
                    key={p.procedure.procedure_id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    {p.procedure.procedure_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <ReadOnlyTable
          title="System Unit Components"
          icon={<Cpu className="w-5 h-5 text-blue-600" />}
          items={displaySystemAssets}
          emptyMsg="No system unit components found."
          isSystemParentIncluded={true}
        />
        <ReadOnlyTable
          title="Peripherals & External Devices"
          icon={<Keyboard className="w-5 h-5 text-gray-600" />}
          items={peripheralAssets}
          emptyMsg="No peripheral assets found."
        />
        <ReadOnlyTable
          title="Network & Software"
          icon={<Network className="w-5 h-5 text-purple-600" />}
          items={networkItems}
          emptyMsg="No network info recorded."
          isNetwork={true}
        />

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-2">
            <AlignLeft className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="font-medium text-gray-900">Overall Remarks</h3>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap pl-7">
            {pmcReport?.overall_remarks || "No overall remarks provided."}
          </p>
        </div>
      </div>

      {/* Repair Modal */}
      {showRepairModal && pmcReport && (
        <RepairModal
          workstation={workstation}
          quarter={quarter}
          labId={pmcReport.lab_id}
          assets={assets}
          statusOptions={statusOptions}
          onSuccess={() => {
            setShowRepairModal(false);
            fetchData();
          }}
          onClose={() => setShowRepairModal(false)}
        />
      )}
    </div>
  );
};

export default MaintenanceView;
