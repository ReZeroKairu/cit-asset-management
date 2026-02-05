//frontend/src/utils/reportDataExample.ts
// Example data structure for the daily accomplishment report
export const dailyAccomplishmentReportData = {
  lab_name: "IT-Lab1",
  current_datetime: "February 2, 2026, 12:05:00 PM", // Current date and time
  custodian_name: "GRANT JAY TUBA",
  noted_by: "Dr. Marco Marvin L. Rado", // Admin who assigned the custodian
  general_remarks:
    "All systems functioning properly. Regular maintenance completed.",

  workstations: [
    {
      workstation_name: "WS-PC1",
      status: "Working",
      remarks: "No issues found",
    },
    {
      workstation_name: "WS-PC2",
      status: "Needs Repair",
      remarks: "Mouse not working properly",
    },
    {
      workstation_name: "WS-PC3",
      status: "Working",
      remarks: "All good",
    },
  ],
};
