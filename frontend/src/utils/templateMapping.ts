// Template mapping for Daily Accomplishment Report
export const mapReportDataToTemplate = (reportData: any) => {
  console.log("Input reportData:", reportData);
  
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
      formattedDateTime = date.toLocaleString();
      console.log("Formatted datetime:", formattedDateTime);
    } else {
      // Fallback to current date/time
      formattedDateTime = new Date().toLocaleString();
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
    end_day_checks: false
  };

  // Check which procedures are completed
  if (reportData.procedures) {
    reportData.procedures.forEach((procedure: any) => {
      switch (procedure.procedure_name.toLowerCase()) {
        case 'hardware checks':
          procedureChecks.hardware_checks = true;
          break;
        case 'software checks':
          procedureChecks.software_checks = true;
          break;
        case 'network & connectivity checks':
          procedureChecks.network_checks = true;
          break;
        case 'cleanliness & organization':
          procedureChecks.cleanliness_checks = true;
          break;
        case 'user management':
          procedureChecks.user_management = true;
          break;
        case 'security & safety':
          procedureChecks.security_safety = true;
          break;
        case 'end of day checks':
          procedureChecks.end_day_checks = true;
          break;
      }
    });
  }

  // Combine all workstation remarks with commas
  const workstationRemarks = reportData.workstations?.map((ws: any) => {
    const remark = ws.remarks?.trim();
    return remark ? `${ws.workstation_name}: ${remark}` : null;
  }).filter(Boolean).join(', ') || '';

  // Map workstations to X marks
  const workstationMarks: any = {};
  console.log("Processing workstations:", reportData.workstations);
  
  if (reportData.workstations) {
    reportData.workstations.forEach((ws: any) => {
      console.log("Processing workstation:", ws);
      // Extract workstation number from name (e.g., "WS-PC1" -> "PC1")
      const wsNumber = ws.workstation_name.replace('WS-', '');
      console.log("Workstation number:", wsNumber);
      workstationMarks[`workstation_${wsNumber}`] = 'X'; // Place X for each workstation
    });
  }
  console.log("Workstation marks:", workstationMarks);

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
    
    // Workstation X marks
    ...workstationMarks,
    
    // Combined workstation remarks
    workstation_remarks: workstationRemarks,
    
    // General remarks for Action Taken section
    remarks_here: reportData.general_remarks || "",
    
    // Keep original data for reference
    original_workstations: reportData.workstations || [],
    original_procedures: reportData.procedures || []
  };
};
