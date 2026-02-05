//frontend/src/utils/templateMapping.ts
// Template mapping for Daily Accomplishment Report
export const mapReportDataToTemplate = (reportData: any) => {
  console.log("Input reportData:", reportData);
  console.log("Date fields:", {
    created_at: reportData.created_at,
    report_date: reportData.report_date,
  });

  // Use the report's creation date for current_datetime
  let formattedDateTime = "";
  try {
    // Try to use created_at first, then report_date as fallback
    const dateSource = reportData.created_at || reportData.report_date;
    console.log("Using date source:", dateSource);

    if (dateSource) {
      const date = new Date(dateSource);
      console.log("Created date object:", date);
      console.log("Date isValid:", !isNaN(date.getTime()));

      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      // Format as MM/DD/YYYY HH:MM AM/PM
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = String(hours % 12 || 12).padStart(2, "0");

      formattedDateTime = `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
      console.log("Formatted datetime:", formattedDateTime);
    } else {
      // Fallback to current date/time
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const year = now.getFullYear();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = String(hours % 12 || 12).padStart(2, "0");

      formattedDateTime = `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
      console.log("Using fallback datetime:", formattedDateTime);
    }
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

  // Check which procedures are completed
  if (reportData.procedures) {
    console.log("Procedures data:", reportData.procedures);
    reportData.procedures.forEach((procedure: any, index: number) => {
      console.log(`Procedure ${index}:`, procedure);
      const procedureName = procedure.procedure_name || procedure.name || '';
      console.log(`Procedure name: "${procedureName}"`);
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
          console.log(`Unknown procedure: "${procedureName}"`);
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
  } else {
    console.log("No procedures found in report data");
  }
  
  console.log("Final procedure checks:", procedureChecks);

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

    // Keep original data for reference
    original_workstations: reportData.workstations || [],
    original_procedures: reportData.procedures || [],
  };
};
