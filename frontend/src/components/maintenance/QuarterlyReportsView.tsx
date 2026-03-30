import React, { useState, useEffect } from "react";
import { FileText, Download, ArrowLeft, Loader2 } from "lucide-react";
import { getLabPMCReports, getPMCReport, getServiceHistory } from "../../api/maintenance";
import { getWorkstationAssets } from "../../api/inventory";
import { useAuth } from "../../context/AuthContext";
import { calculateWorstStatus } from "../../utils/statusUtils";
import { generateQPMCReportFromDb } from "../../utils/generateQPMC";
import { generateQPMCReport } from "../../utils/reportGenerator";

interface Props {
  labId: number | null;
  labName: string;
  labWorkstations: any[]; // ✅ Added labWorkstations here
  onBack: () => void;
}

const QuarterlyReportsView: React.FC<Props> = ({
  labId,
  labName,
  labWorkstations,
  onBack,
}) => {
  const { user } = useAuth();
  const [selectedQuarter, setSelectedQuarter] = useState<string>("1st");
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<number | null>(
    null
  );
  const [workstationAssets, setWorkstationAssets] = useState<{
    [key: number]: any[];
  }>({});
  const [latestServiceTimes, setLatestServiceTimes] = useState<{
    [key: number]: Date | null;
  }>({});

  // Calculate latest service date for each workstation
  const getLatestServiceDateTime = (workstationId: number) => {
    // Use the latest service time from our state (fetched from all quarters)
    return latestServiceTimes[workstationId] || null;
  };

  // Calculate real workstation status based on assets (same logic as MaintenanceView)
  const calculateWorkstationStatus = (assets: any[]) => {
    if (!assets || assets.length === 0) return "Functional";
    return calculateWorstStatus(assets);
  };

  const quartersList = [
    { id: "1st", num: "Q1", label: "1st Quarter" },
    { id: "2nd", num: "Q2", label: "2nd Quarter" },
    { id: "3rd", num: "Q3", label: "3rd Quarter" },
    { id: "4th", num: "Q4", label: "4th Quarter" },
  ];

  // ✅ Helper function to find the correct workstation name
  const getWorkstationName = (wsId: number) => {
    const ws = labWorkstations.find((w) => w.workstation_id === wsId);
    return ws ? ws.workstation_name : wsId;
  };

  // Fetch workstation reports and assets for this quarter
  useEffect(() => {
    const fetchReportsAndAssets = async () => {
      if (!labId) return;
      setLoadingReports(true);
      try {
        const reportsData = await getLabPMCReports(labId, selectedQuarter);
        setReports(reportsData);

        // Fetch assets for each workstation to calculate real status
        const assetsPromises = reportsData.map(async (report: any) => {
          try {
            const assets = await getWorkstationAssets(report.workstation_id);
            return { workstationId: report.workstation_id, assets };
          } catch (error) {
            console.error(
              `Failed to fetch assets for workstation ${report.workstation_id}:`,
              error
            );
            return { workstationId: report.workstation_id, assets: [] };
          }
        });

        const assetsResults = await Promise.all(assetsPromises);
        const assetsMap = assetsResults.reduce((acc, result) => {
          acc[result.workstationId] = result.assets;
          return acc;
        }, {} as { [key: number]: any[] });

        setWorkstationAssets(assetsMap);

        // Fetch latest service times for all workstations (across all quarters)
        const serviceTimePromises = reportsData.map(async (report: any) => {
          try {
            // Fetch ALL service history (not just current quarter) to get true latest service
            const serviceHistory = await getServiceHistory(report.workstation_id); // No quarter parameter = all history
            if (serviceHistory && serviceHistory.length > 0) {
              // Find the most recent service log
              const latestService = serviceHistory.reduce((latest, current) => {
                const latestDate = new Date(latest.service_date || latest.created_at);
                const currentDate = new Date(current.service_date || current.created_at);
                return currentDate > latestDate ? current : latest;
              });
              
              // Use service_date if available, otherwise fall back to created_at
              const serviceDate = latestService.service_date || latestService.created_at;
              return { 
                workstationId: report.workstation_id, 
                latestServiceDate: new Date(serviceDate)
              };
            }
            return { workstationId: report.workstation_id, latestServiceDate: null };
          } catch (error) {
            console.error(
              `Failed to fetch service history for workstation ${report.workstation_id}:`,
              error
            );
            return { workstationId: report.workstation_id, latestServiceDate: null };
          }
        });

        const serviceTimeResults = await Promise.all(serviceTimePromises);
        const serviceTimesMap = serviceTimeResults.reduce((acc, result) => {
          acc[result.workstationId] = result.latestServiceDate;
          return acc;
        }, {} as { [key: number]: Date | null });

        setLatestServiceTimes(serviceTimesMap);
      } catch (error) {
        console.error("Failed to fetch reports", error);
        setReports([]);
        setWorkstationAssets({});
        setLatestServiceTimes({});
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReportsAndAssets();
  }, [labId, selectedQuarter]);

  const handleDownloadWorkstationReport = async (report: any) => {
    setDownloadingReportId(report.pmc_id);
    try {
      const detailedReport = await getPMCReport(
        report.workstation_id,
        selectedQuarter
      );
      const assetData = await getWorkstationAssets(report.workstation_id);
      const filteredAssetData = assetData.filter((asset: any) => asset.status !== 'Disposed');
      // Use the same shared function:
      await generateQPMCReportFromDb({
        pmcReport: detailedReport,
        assets: filteredAssetData,
        lab: labName,
        workstation: getWorkstationName(report.workstation_id),
        user,
      });
    } catch (err) {
      alert("Failed to generate workstation report.");
    } finally {
      setDownloadingReportId(null);
    }
  };

  const generateWorkstationReport = async (
    pmcReport: any,
    assets: any[],
    workstationName: string
  ) => {
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

    // Format the Database Report Date
    const reportDate = new Date(pmcReport.report_date);
    const formattedDate = reportDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Get service time from the report
    const serviceTime = new Date(pmcReport.report_date);
    const formattedTime = serviceTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const completedProcedures = pmcReport.procedures || [];

    // Map Procedures to Checkmarks
    const checkProc = (name: string) =>
      completedProcedures.some((p: any) => p.procedure.procedure_name === name)
        ? "☑"
        : "☐";

    // Map Statuses to Table Checkmarks
    const mapStatus = (status: string) => ({
      func: ["Functional", "Working", "Operational"].includes(status)
        ? "✓"
        : "",
      rep: status === "For Repair" ? "✓" : "",
      upg: status === "For Upgrade" ? "✓" : "",
      repl: status === "For Replacement" ? "✓" : "",
    });

    // Separate Assets into Peripherals and System Components
    const systemComponents = assets.filter((asset) =>
      SYSTEM_UNIT_TYPES.some(
        (type) => type.toLowerCase() === asset.unit_name.toLowerCase()
      ) && asset.status !== 'Disposed'
    );
    const peripheralComponents = assets.filter(
      (asset) =>
        !SYSTEM_UNIT_TYPES.some(
          (type) => type.toLowerCase() === asset.unit_name.toLowerCase()
        ) && asset.status !== 'Disposed'
    );

    // Build components list with Peripherals first
    const componentsList = peripheralComponents.map((asset) => ({
      name: asset.unit_name,
      ...mapStatus(asset.status),
      tag: asset.property_tag_no || "N/A",
      remarks: asset.asset_remarks || "",
    }));

    // Add System Unit Parent row with shared utility
    const systemUnitStatus = calculateWorstStatus(systemComponents);

    componentsList.push({
      name: "System Unit",
      ...mapStatus(systemUnitStatus),
      tag: "N/A",
      remarks: systemUnitStatus === "Functional" ? "Functional" : "",
    });

    // Add System Unit Components
    systemComponents.forEach((asset) => {
      componentsList.push({
        name: `   ↳ ${asset.unit_name}`,
        ...mapStatus(asset.status),
        tag: asset.property_tag_no || "N/A",
        remarks: asset.asset_remarks || "",
      });
    });

    // Add Software & Network Items
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

    // Construct Final Payload
    const templateData = {
      date: formattedDate,
      time: formattedTime,
      lab: labName,
      workstation: workstationName,
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

  return (
    <div className="space-y-4">
      {/* Header & Back Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Quarterly Master Reports
          </h2>
          <p className="text-sm text-gray-500">
            Download consolidated laboratory QPMC reports
          </p>
        </div>
        <button
          onClick={onBack}
          className="h-10 px-4 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 flex items-center font-medium shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workstations
        </button>
      </div>

      <div>
        {/* TABS UI (Matching MaintenancePage) */}
        <div className="flex gap-2 items-end h-21.25">
          {quartersList.map((q) => {
            const isActive = selectedQuarter === q.id;
            return (
              <button
                key={q.id}
                onClick={() => setSelectedQuarter(q.id)}
                className={`relative flex flex-col items-start justify-center w-36 transition-all ${
                  isActive
                    ? "bg-white text-blue-600 rounded-t-2xl z-10 border-t border-x border-gray-100 px-6 py-4 -mb-px shadow-[0_-4px_10px_rgba(0,0,0,0.02)]"
                    : "bg-blue-500 text-white hover:bg-blue-600 rounded-xl px-5 py-3 mb-2 shadow-sm"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 rounded-r-md"></div>
                )}
                <div className={isActive ? "pl-1" : ""}>
                  <span className="text-2xl font-bold leading-none block text-left mb-1">
                    {q.num}
                  </span>
                  <span
                    className={`text-xs font-medium tracking-wide block text-left ${
                      isActive ? "text-gray-500" : "text-blue-100"
                    }`}
                  >
                    {q.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* REPORTS TABLE */}
        <div className="bg-white shadow-sm rounded-xl rounded-tl-none overflow-hidden border border-gray-100 relative z-0">
          <div className="p-5 border-b border-gray-100 bg-white flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {selectedQuarter} Quarter Reports
            </h3>
          </div>

          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[35%]">
                  Workstation Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">
                  Last Service Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">
                  Serviced By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">
                  Current Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {loadingReports ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Loading reports...
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No workstations have been serviced for the {selectedQuarter}{" "}
                    Quarter yet.
                  </td>
                </tr>
              ) : (
                [...reports]
                  .sort((a, b) => {
                    const wsNameA = getWorkstationName(a.workstation_id);
                    const wsNameB = getWorkstationName(b.workstation_id);
                    const displayTitleA = String(wsNameA)
                      .toLowerCase()
                      .includes("workstation")
                      ? wsNameA
                      : `Workstation ${wsNameA}`;
                    const displayTitleB = String(wsNameB)
                      .toLowerCase()
                      .includes("workstation")
                      ? wsNameB
                      : `Workstation ${wsNameB}`;
                    return displayTitleA.localeCompare(displayTitleB);
                  })
                  .map((report) => {
                    // ✅ Use the helper function here to grab the correct name
                    const wsName = getWorkstationName(report.workstation_id);
                    const displayTitle = String(wsName)
                      .toLowerCase()
                      .includes("workstation")
                      ? wsName
                      : `Workstation ${wsName}`;

                    // Calculate real workstation status based on current assets
                    const assets =
                      workstationAssets[report.workstation_id] || [];
                    const calculatedWorkstationStatus =
                      calculateWorkstationStatus(assets);

                    return (
                      <tr
                        key={report.pmc_id}
                        className="hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <FileText className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {displayTitle}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {report.service_count > 1
                                  ? `${report.service_count} services this quarter`
                                  : "First service this quarter"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {(() => {
                              const latestDateTime = getLatestServiceDateTime(report.workstation_id);
                              return latestDateTime 
                                ? latestDateTime.toLocaleDateString()
                                : new Date(report.report_date).toLocaleDateString();
                            })()}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {(() => {
                              const latestDateTime = getLatestServiceDateTime(report.workstation_id);
                              if (latestDateTime) {
                                const dateString = latestDateTime.toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric", year: "numeric" }
                                );
                                
                                // Check if the time is not midnight UTC (which becomes 8 AM SGT)
                                const isMidnightUTC = latestDateTime.getUTCHours() === 0 && 
                                                      latestDateTime.getUTCMinutes() === 0 && 
                                                      latestDateTime.getUTCSeconds() === 0;

                                if (!isMidnightUTC) {
                                  const timeDisplay = latestDateTime.toLocaleTimeString(
                                    "en-US",
                                    { hour: "numeric", minute: "2-digit", hour12: true }
                                  );
                                  return `Service: ${dateString} at ${timeDisplay}`;
                                } else {
                                  return `Service: ${dateString}`;
                                }
                              }
                              return "No service";
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {report.user?.full_name || "Custodian"}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {report.user?.role || "Staff"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                              calculatedWorkstationStatus === "Functional" ||
                              calculatedWorkstationStatus === "Working" ||
                              calculatedWorkstationStatus === "Operational"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : calculatedWorkstationStatus ===
                                  "For Replacement"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : calculatedWorkstationStatus === "For Repair"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : calculatedWorkstationStatus === "For Upgrade"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {calculatedWorkstationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() =>
                              handleDownloadWorkstationReport(report)
                            }
                            disabled={downloadingReportId === report.pmc_id}
                            className="inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
                          >
                            {downloadingReportId === report.pmc_id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuarterlyReportsView;
