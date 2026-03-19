import { calculateWorstStatus } from "./statusUtils";
import { generateQPMCReport } from "./reportGenerator";

// SYSTEM_UNIT_TYPES should be exported here for single-source-of-truth
export const SYSTEM_UNIT_TYPES = [
  "SSD", "PSU", "RAM", "CPU", "HDD", "Case", "CPU Fan",
  "Motherboard", "System Fan", "GPU", "Video Card"
];

export async function generateQPMCReportFromDb({
  pmcReport,
  assets,
  lab,
  workstation,
  user
}: {
  pmcReport: any,
  assets: any[],
  lab: string,
  workstation: string,
  user?: any
}) {
  // --- THE CORE LOGIC FROM MaintenanceView HANDLE DOWNLOAD ---
  const completedProcedures = pmcReport.procedures || [];
  const checkProc = (name: string) =>
    completedProcedures.some((p: any) =>
      (p.procedure_name || p.procedure?.procedure_name) === name
    ) ? "☑" : "☐";
  const mapStatus = (status: string) => ({
    func: ["Functional", "Working", "Operational"].includes(status) ? "✓" : "",
    rep: status === "For Repair" ? "✓" : "",
    upg: status === "For Upgrade" ? "✓" : "",
    repl: status === "For Replacement" ? "✓" : "",
  });

  const systemComponents = assets.filter((asset) =>
    SYSTEM_UNIT_TYPES.some(
      (type) => type.toLowerCase() === asset.unit_name.toLowerCase()
    )
  );
  const peripheralComponents = assets.filter(
    (asset) =>
      !SYSTEM_UNIT_TYPES.some(
        (type) => type.toLowerCase() === asset.unit_name.toLowerCase()
      )
  );

  // Build array: peripherals only, then System Unit summary, then software/network
  const componentsList = peripheralComponents.map((asset) => {
    const statusMap = mapStatus(asset.status);
    return {
      name: asset.unit_name,
      func: statusMap.func,
      rep: statusMap.rep,
      upg: statusMap.upg,
      repl: statusMap.repl,
      tag: asset.property_tag_no || "N/A",
      remarks: asset.asset_remarks || "",
    };
  });

  const systemUnitStatus = calculateWorstStatus(systemComponents);
  const systemUnitMap = mapStatus(systemUnitStatus);
  componentsList.push({
    name: "System Unit",
    func: systemUnitMap.func,
    rep: systemUnitMap.rep,
    upg: systemUnitMap.upg,
    repl: systemUnitMap.repl,
    tag: "N/A",
    remarks: systemUnitStatus === 'Functional' ? "Functional" : "",
  });

  // Software & network rows
  const softwareMap = mapStatus(pmcReport.software_status);
  componentsList.push({
    name: "Software",
    func: softwareMap.func,
    rep: softwareMap.rep,
    upg: softwareMap.upg,
    repl: softwareMap.repl,
    tag: "N/A",
    remarks: pmcReport.software_name || "",
  });

  const connTypeStr =
    pmcReport.connectivity_type === "Wired"
      ? "☑ Wired   ☐ Wireless"
      : pmcReport.connectivity_type === "Wireless"
        ? "☐ Wired   ☑ Wireless"
        : "☐ Wired   ☐ Wireless";
  const connTypeMap = mapStatus(pmcReport.connectivity_type_status);
  componentsList.push({
    name: "Connectivity Type",
    func: connTypeMap.func,
    rep: connTypeMap.rep,
    upg: connTypeMap.upg,
    repl: connTypeMap.repl,
    tag: "N/A",
    remarks: connTypeStr,
  });

  const connSpeedMap = mapStatus(pmcReport.connectivity_speed_status);
  componentsList.push({
    name: "Connectivity Speed",
    func: connSpeedMap.func,
    rep: connSpeedMap.rep,
    upg: connSpeedMap.upg,
    repl: connSpeedMap.repl,
    tag: "N/A",
    remarks: pmcReport.connectivity_speed || "",
  });

  const rawCustodianName =
    pmcReport?.user?.full_name ||
    (user as any)?.full_name ||
    (user as any)?.name ||
    (user as any)?.fullName ||
    "YOUR NAME HERE";

  // Format date
  const reportDate = new Date(pmcReport.report_date);
  const formattedDate = reportDate.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const currentTime = new Date();
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit"
  });

  const templateData = {
    date: formattedDate,
    time: formattedTime,
    lab: lab,
    workstation: workstation,
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

  await generateQPMCReport(templateData);
}