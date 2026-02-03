// Template mapping for Daily Accomplishment Report
export const mapReportDataToTemplate = (reportData: any) => {
  console.log("Input reportData:", reportData);

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

  return {
    // Basic info
    lab_name: reportData.lab_name,
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
    original_procedures: reportData.procedures || []
  };
};
