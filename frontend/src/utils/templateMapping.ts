//frontend/src/utils/templateMapping.ts
// Template mapping for Daily Accomplishment Report
export const mapReportDataToTemplate = (reportData: any) => {

  // Use current date/time for Word document generation
  let formattedDateTime = "";
  try {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = String(hours % 12 || 12).padStart(2, "0");

    formattedDateTime = `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
  } catch (error) {
    console.error("Date formatting error:", error);
    formattedDateTime = new Date().toLocaleString(); // Fallback
  }

  // Map procedures to checkmarks
  const procedureChecks = {
    hardware_checks: false,
    software_checks: false,
    network_checks: false,
    cleanliness_checks: false,
    user_management: false,
    security_safety: false,
    end_day_checks: false,
  };

  // Handle automated DAR structure (procedures as boolean flags)
  if (reportData.procedures && typeof reportData.procedures === 'object') {
    // Check if it's the automated DAR structure with boolean flags
    if (typeof reportData.procedures.hardware_checks === 'boolean') {
      procedureChecks.hardware_checks = reportData.procedures.hardware_checks;
      procedureChecks.software_checks = reportData.procedures.software_checks;
      procedureChecks.network_checks = reportData.procedures.network_checks;
      procedureChecks.cleanliness_checks = reportData.procedures.cleanliness_checks;
      procedureChecks.user_management = reportData.procedures.user_management;
      procedureChecks.security_safety = reportData.procedures.security_safety;
      procedureChecks.end_day_checks = reportData.procedures.end_day_checks;
    } else {
      // Handle traditional procedure array structure
      reportData.procedures.forEach((procedure: any) => {
        const procedureName = procedure.procedure_name || procedure.name || '';
        switch (procedureName.toLowerCase()) {
          case "hardware checks":
            procedureChecks.hardware_checks = true;
            break;
          case "software checks":
            procedureChecks.software_checks = true;
            break;
          case "network & connectivity checks":
            procedureChecks.network_checks = true;
            break;
          case "cleanliness & organization":
            procedureChecks.cleanliness_checks = true;
            break;
          case "user management":
            procedureChecks.user_management = true;
            break;
          case "security & safety":
            procedureChecks.security_safety = true;
            break;
          case "end of day checks":
            procedureChecks.end_day_checks = true;
            break;
          default:
            // Try to match by partial name
            if (procedureName.toLowerCase().includes('hardware')) {
              procedureChecks.hardware_checks = true;
            } else if (procedureName.toLowerCase().includes('software')) {
              procedureChecks.software_checks = true;
            } else if (procedureName.toLowerCase().includes('network')) {
              procedureChecks.network_checks = true;
            } else if (procedureName.toLowerCase().includes('cleanliness')) {
              procedureChecks.cleanliness_checks = true;
            } else if (procedureName.toLowerCase().includes('user')) {
              procedureChecks.user_management = true;
            } else if (procedureName.toLowerCase().includes('security')) {
              procedureChecks.security_safety = true;
            } else if (procedureName.toLowerCase().includes('end')) {
              procedureChecks.end_day_checks = true;
            }
        }
      });
    }
  }

  // Map workstation checkmarks (ws_1 through ws_40), excluding Server
  const workstationChecks: any = {};
  for (let i = 1; i <= 40; i++) {
    // Check if workstation was included in daily report (selected by custodian)
    const ws = reportData.workstations?.find((w: any) => {
      // Skip Server workstation
      if (w.workstation_name?.toLowerCase().includes('server')) {
        return false;
      }
      const wsNum = w.workstation_name?.match(/\d+/)?.[0];
      return wsNum === String(i);
    });
    
    // Handle automated DAR structure (checked field)
    if (ws && ws.checked) {
      workstationChecks[`ws_${i}`] = "✓";
    } else {
      workstationChecks[`ws_${i}`] = "";
    }
  }

  return {
    // Basic info
    lab_name: reportData.lab_name,
    current_datetime: formattedDateTime,
    custodian_name: reportData.custodian_name,
    noted_by: reportData.noted_by,
    general_remarks: reportData.general_remarks || "",

    // Procedure checkmarks
    hardware_checks: procedureChecks.hardware_checks ? "☑" : "☐",
    software_checks: procedureChecks.software_checks ? "☑" : "☐",
    network_checks: procedureChecks.network_checks ? "☑" : "☐",
    cleanliness_checks: procedureChecks.cleanliness_checks ? "☑" : "☐",
    user_management: procedureChecks.user_management ? "☑" : "☐",
    security_safety: procedureChecks.security_safety ? "☑" : "☐",
    end_day_checks: procedureChecks.end_day_checks ? "☑" : "☐",

    // Workstation checkmarks
    ...workstationChecks,

    // Keep original data for reference
    original_workstations: reportData.workstations || [],
    original_procedures: reportData.procedures || [],
  };
};
