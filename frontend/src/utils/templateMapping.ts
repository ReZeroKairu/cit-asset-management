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
        const isCompleted = procedure.overall_status === "Completed";
        
        switch (procedureName.toLowerCase()) {
          case "hardware checks":
            procedureChecks.hardware_checks = isCompleted;
            break;
          case "software checks":
            procedureChecks.software_checks = isCompleted;
            break;
          case "network & connectivity checks":
            procedureChecks.network_checks = isCompleted;
            break;
          case "cleanliness & organization":
            procedureChecks.cleanliness_checks = isCompleted;
            break;
          case "user management":
            procedureChecks.user_management = isCompleted;
            break;
          case "security & safety":
            procedureChecks.security_safety = isCompleted;
            break;
          case "end of day checks":
            procedureChecks.end_day_checks = isCompleted;
            break;
          default:
            // Try to match by partial name
            if (procedureName.toLowerCase().includes('hardware')) {
              procedureChecks.hardware_checks = isCompleted;
            } else if (procedureName.toLowerCase().includes('software')) {
              procedureChecks.software_checks = isCompleted;
            } else if (procedureName.toLowerCase().includes('network')) {
              procedureChecks.network_checks = isCompleted;
            } else if (procedureName.toLowerCase().includes('cleanliness')) {
              procedureChecks.cleanliness_checks = isCompleted;
            } else if (procedureName.toLowerCase().includes('user')) {
              procedureChecks.user_management = isCompleted;
            } else if (procedureName.toLowerCase().includes('security')) {
              procedureChecks.security_safety = isCompleted;
            } else if (procedureName.toLowerCase().includes('end')) {
              procedureChecks.end_day_checks = isCompleted;
            }
        }
      });
    }
  }

  // Map workstation checkmarks (ws_1 through ws_40), excluding Server
  const workstationChecks: any = {};
  const workstationRemarks: any = {};
  
  for (let i = 1; i <= 40; i++) {
    // Check if workstation was included in daily report (selected by custodian)
    const ws = reportData.workstations?.find((w: any) => {
      // Try matching by workstation_id first, then by name
      if (w.workstation_id === i) {
        return true;
      }
      
      // Skip Server workstation
      if (w.workstation_name?.toLowerCase().includes('server')) {
        return false;
      }
      
      const wsNum = w.workstation_name?.match(/\d+/)?.[0];
      return wsNum === String(i);
    });
    
    // Handle workstation checkmarks
    const wsKey = `ws_${i}`;
    if (ws) {
      // For auto-generated reports, check if workstation has any data or status
      // Auto-generated reports should have checkmarks for workstations that were involved
      if (ws.checked || ws.status === "Working" || (ws.remarks && ws.remarks.trim() !== "")) {
        workstationChecks[wsKey] = "✓";
      } else {
        workstationChecks[wsKey] = "";
      }
    } else {
      workstationChecks[wsKey] = "";
    }

    // Map workstation remarks
    workstationRemarks[`ws_${i}_remarks`] = ws?.remarks || "";
  }
  
  // Handle unified reports - combine detailed remarks from generated_data
  let remarksForTemplate = reportData.general_remarks || "";
  if (reportData.report_type === 'unified' && reportData.generated_data) {
    const complaintsRemarks = reportData.generated_data.complaints_remarks || "";
    const formsRemarks = reportData.generated_data.forms_remarks || "";
    const maintenanceRemarks = reportData.generated_data.maintenance_remarks || "";
    if (complaintsRemarks || formsRemarks || maintenanceRemarks) {
      remarksForTemplate = [
        "=== COMPLAINTS ===",
        complaintsRemarks,
        "",
        "=== SOFTWARE INSTALLATIONS ===",
        formsRemarks,
        "",
        "=== MAINTENANCE ===",
        maintenanceRemarks
      ].filter(Boolean).join('\n');
    }
  } else if (reportData.report_type === 'auto_maintenance' && reportData.generated_data) {
    // Handle individual maintenance reports
    const maintenanceRemarks = reportData.generated_data.maintenance_remarks || "";
    if (maintenanceRemarks) {
      remarksForTemplate = maintenanceRemarks;
    }
  }

  const result = {
    // Basic info
    lab_name: reportData.lab_name,
    current_datetime: formattedDateTime,
    custodian_name: reportData.custodian_name,
    noted_by: reportData.noted_by,
    general_remarks: remarksForTemplate,

    // Procedure checkmarks
    hardware_checks: procedureChecks.hardware_checks ? "☑" : "☐",
    software_checks: procedureChecks.software_checks ? "☑" : "☐",
    network_checks: procedureChecks.network_checks ? "☑" : "☐",
    cleanliness_checks: procedureChecks.cleanliness_checks ? "☑" : "☐",
    user_management: procedureChecks.user_management ? "☑" : "☐",
    security_safety: procedureChecks.security_safety ? "☑" : "☐",
    end_day_checks: procedureChecks.end_day_checks ? "☑" : "☐",

    // Workstation checkmarks - direct assignment based on actual workstations found
    ...workstationChecks,

    // Workstation remarks (using different keys to avoid conflicts)
    ...workstationRemarks,

    // Keep original data for reference
    original_workstations: reportData.workstations || [],
    original_procedures: reportData.procedures || [],
  };
  
  return result;
};
