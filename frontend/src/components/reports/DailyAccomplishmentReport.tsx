import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { generateTemplateReport } from "../../utils/generateTemplateReport";
import { mapReportDataToTemplate } from "../../utils/templateMapping";
import { FileDown, X } from "lucide-react";

interface WorkstationItem {
  workstation_id: number;
  workstation_name: string;
  status: string;
  remarks: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  reportId?: number; // Optional: if editing existing report
  mode?: "single" | "all"; // New: single report or all reports mode
  archiveMode?: boolean; // Add archive mode prop
  pageContext?: "daily-reports" | "archives"; // Add page context
}

const DailyAccomplishmentReport: React.FC<Props> = ({
  show,
  onClose,
  reportId,
  mode = "single",
  archiveMode = false,
  pageContext = "archives",
}) => {
  const { user } = useAuth();
  const [workstations, setWorkstations] = useState<WorkstationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [availableReports, setAvailableReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [generateMode, setGenerateMode] = useState<"single" | "all" | "compiled">("single");
  const [dateFilters, setDateFilters] = useState({
    start_date: "",
    end_date: "",
  });

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Format date for display in modal
  const formatDisplayDateTime = (dateString: string | undefined) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      // Format as MM/DD/YYYY HH:MM AM/PM
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = String(hours % 12 || 12).padStart(2, "0");

      return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };

  useEffect(() => {
    if (show) {
      setGenerateMode(mode || "single");
      loadAvailableReports();
      if (reportId) {
        loadExistingReport(reportId);
      }
      // Don't load fresh data - only work with existing reports
    }
  }, [show, reportId, mode]);


  // Filter reports by date and creator
  const getFilteredReports = () => {
    let filtered = availableReports;

    // For compiled mode, require date filters
    if (generateMode === "compiled") {
      if (!dateFilters.start_date && !dateFilters.end_date) {
        return []; // Return empty if no date filters in compiled mode
      }
    }

    // Apply date filters
    if (dateFilters.start_date || dateFilters.end_date) {
      filtered = filtered.filter((report) => {
        const reportDate = new Date(report.report_date || report.created_at);
        const startDate = dateFilters.start_date
          ? new Date(dateFilters.start_date + "T00:00:00")
          : null;
        const endDate = dateFilters.end_date
          ? new Date(dateFilters.end_date + "T23:59:59")
          : null;

        console.log("Filtering report:", {
          reportDate: reportDate.toISOString(),
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          startFilter: dateFilters.start_date,
          endFilter: dateFilters.end_date
        });

        if (startDate && reportDate < startDate) return false;
        if (endDate && reportDate > endDate) return false;

        return true;
      });
    }

    // For custodians, only show reports they created (only in non-archive, non-daily-reports context)
    if (
      !archiveMode &&
      pageContext !== "daily-reports" &&
      user?.role !== "Admin"
    ) {
      filtered = filtered.filter((report) => report.created_by === user?.id);
    }

    // For compiled mode, only keep the latest report per day
    if (generateMode === "compiled" && filtered.length > 0) {
      const reportsByDate = new Map<string, any>();
      
      filtered.forEach((report) => {
        const dateKey = new Date(report.report_date || report.created_at).toDateString();
        const existing = reportsByDate.get(dateKey);
        
        // Keep the report with the latest created_at timestamp
        if (!existing || new Date(report.created_at) > new Date(existing.created_at)) {
          reportsByDate.set(dateKey, report);
        }
      });
      
      filtered = Array.from(reportsByDate.values());
    }

    return filtered;
  };

  const loadAvailableReports = async () => {
    try {
      let response;

      // In archive mode, respect creator permissions and only show approved reports
      if (archiveMode) {
        if (user?.role === "Admin") {
          response = await api.get("/daily-reports?status=Approved");
        } else {
          // Custodians can only see their own approved reports in archive mode
          response = await api.get(
            `/daily-reports?created_by=${user?.id}&status=Approved`
          );
        }
      } else {
        // Normal mode - check page context
        if (pageContext === "daily-reports") {
          // On Daily Reports page, show only pending reports
          if (user?.role === "Admin") {
            response = await api.get("/daily-reports?status=Pending");
          } else {
            // For custodians, only get pending reports from their assigned lab
            response = await api.get(
              `/daily-reports?status=Pending&lab_id=${user?.lab_id}`
            );
          }
        } else {
          // Normal filtering by role
          if (user?.role === "Admin") {
            response = await api.get("/daily-reports");
          } else {
            // For custodians, only get reports from their assigned lab
            response = await api.get(`/daily-reports?lab_id=${user?.lab_id}`);
          }
        }
      }

      // Check if response.data is an array before sorting
      let reportsData = response.data;
      if (!Array.isArray(reportsData)) {
        // If it's an object, try to extract array from common properties
        reportsData =
          reportsData.data ||
          reportsData.reports ||
          reportsData.dailyReports ||
          [];
      }

      // Sort reports by newest to oldest (using created_at or report_date)
      const sortedReports = reportsData.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || a.report_date);
        const dateB = new Date(b.created_at || b.report_date);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });

      setAvailableReports(sortedReports);
    } catch (error) {
      console.error("Failed to load available reports:", error);
    }
  };

  const loadExistingReport = async (id: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/daily-reports/${id}`);
      const report = response.data;

      // Security check: Custodians can only access reports from their own lab
      if (user?.role !== "Admin" && report.lab_id !== user?.lab_id) {
        throw new Error(
          "Access denied: You can only access reports from your assigned laboratory"
        );
      }

      // Get lab info to find who assigned the custodian
      await api.get(`/laboratories/${report.lab_id}`);

      // Process workstation data from the report
      const processedWorkstations =
        report.workstation_items?.map((item: any) => ({
          workstation_id: item.workstation_id,
          workstation_name: item.workstation_name || "Unknown Workstation",
          status: item.status || "Working",
          remarks: item.remarks || "",
        })) || [];

      setWorkstations(processedWorkstations);

      setReportData({
        lab_name: report.laboratories?.lab_name || "Unknown Lab",
        lab_id: report.lab_id, // Add lab_id for template selection
        custodian_name:
          report.users?.full_name?.toUpperCase() ||
          user?.name?.toUpperCase() ||
          "UNKNOWN",
        noted_by: "DR. MARCO MARVIN L. RADO",
        general_remarks: report.general_remarks || "",
        workstations: processedWorkstations,
        procedures: report.procedures || [], // Add procedures data
        report_id: report.report_id,
        created_at: report.created_at || report.report_date, // Add creation timestamp with fallback
        report_date: report.report_date, // Add report date
        report_type: report.report_type || "manual", // Add report type for template selection
        current_datetime: formatDisplayDateTime(
          report.created_at || report.report_date
        ), // Add formatted display date
      });

          } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (generateMode === "all") {
      await generateAllReports();
    } else if (generateMode === "compiled") {
      await generateCompiledRemarks();
    } else {
      await generateSingleReport();
    }
  };

  const getLabTemplate = (labId: number, reportType?: string): string => {
    // Use auto template for automated reports
    if (reportType && reportType !== 'manual') {
      switch (labId) {
        case 1:
          return "/Lab1_DAR_auto.docx"; // CIT-Lab 1 auto template
        case 2:
          return "/Lab2_DAR_auto.docx"; // CIT-Lab 2 auto template
        case 3:
          return "/CiscoLab_DAR_auto.docx"; // CIT-CISCO Lab auto template
        default:
          return "/Lab2_DAR_auto.docx"; // Default auto template
      }
    }
    
    // Use regular template for manual reports
    switch (labId) {
      case 1:
        return "/Lab1_DAR.docx"; // CIT-Lab 1 template
      case 2:
        return "/Lab2_DAR.docx"; // CIT-Lab 2 template
      case 3:
        return "/CiscoLab_DAR.docx"; // CIT-CISCO Lab template
      default:
        return "/Lab2_DAR.docx"; // Default template
    }
  };

  const generateSingleReport = async () => {
    if (!reportData) return;

    try {
      // Determine template based on lab_id and report_type using helper function
      const templateFile = getLabTemplate(reportData.lab_id, reportData.report_type);

      // Map the report data to template format
      const templateData = mapReportDataToTemplate(reportData);

      await generateTemplateReport(
        templateFile,
        templateData,
        `Daily_Accomplishment_Report_Lab${reportData.lab_id}_${
          reportData.report_id
        }_${new Date(reportData.report_date).toISOString().split("T")[0]}.docx`
      );
    } catch (error) {
      console.error("Download failed:", error);
      alert(
        `Failed to generate report. Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const generateAllReports = async () => {
    const reportsToGenerate = getFilteredReports();
    if (reportsToGenerate.length === 0) {
      alert("No reports available to generate with current filters.");
      return;
    }

    try {
      setLoading(true);
      for (const report of reportsToGenerate) {
        // Get detailed report data including workstations and procedures
        const detailedReportResponse = await api.get(
          `/daily-reports/${report.report_id}`
        );
        const detailedReport = detailedReportResponse.data;

        // Get lab info for the noted_by field
        await api.get(`/laboratories/${report.lab_id}`);

        // Process workstation data
        const processedWorkstations =
          detailedReport.workstation_items?.map((item: any) => ({
            workstation_name: item.workstation_name || "Unknown Workstation",
            status: item.status || "Working",
            remarks: item.remarks || "",
          })) || [];

        // Map the report data to template format
        const templateData = mapReportDataToTemplate({
          lab_name: detailedReport.laboratories?.lab_name || "Unknown Lab",
          custodian_name:
            detailedReport.users?.full_name?.toUpperCase() || "UNKNOWN",
          noted_by: "DR. MARCO MARVIN L. RADO",
          general_remarks: detailedReport.general_remarks || "",
          workstations: processedWorkstations,
          procedures: detailedReport.procedures || [], // Include procedures
          report_id: detailedReport.report_id,
          created_at: detailedReport.created_at || detailedReport.report_date, // Add creation timestamp with fallback
          report_date: detailedReport.report_date, // Add report date
          report_type: detailedReport.report_type || "manual", // Add report type for template selection
        });

        // Determine template based on lab_id and report_type using helper function
        const templateFile = getLabTemplate(detailedReport.lab_id, detailedReport.report_type);

        await generateTemplateReport(
          templateFile,
          templateData,
          `Daily_Accomplishment_Report_Lab${detailedReport.lab_id}_${
            detailedReport.report_id
          }_${
            new Date(detailedReport.report_date).toISOString().split("T")[0]
          }.docx`
        );
      }
      alert(`Successfully generated ${reportsToGenerate.length} reports!`);
    } catch (error) {
      console.error("Bulk download failed:", error);
      alert(
        "Failed to generate some reports. Please check if the template exists."
      );
    } finally {
      setLoading(false);
    }
  };

  const generateCompiledRemarks = async () => {
    const reportsToCompile = getFilteredReports();
    if (reportsToCompile.length === 0) {
      alert("No reports available to compile with current filters.");
      return;
    }

    // Sort reports by report_date from oldest to latest for compiled remarks
    reportsToCompile.sort((a: any, b: any) => {
      const dateA = new Date(a.report_date).getTime();
      const dateB = new Date(b.report_date).getTime();
      return dateA - dateB; // Oldest first
    });


    try {
      setLoading(true);

      // Format dates for display
      const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString();
      };

      // Format time for display
      const formatTimeForDisplay = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        // Check if the dateString contains a time component (e.g., 'T' or a colon)
        // If it's a date-only string (YYYY-MM-DD), new Date() defaults to midnight UTC,
        // which becomes 08:00 AM in UTC+8. We want to avoid showing a misleading time.
        if (dateString.includes('T') || dateString.includes(':')) {
          const hours = date.getHours();
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          const formattedHours = String(hours % 12 || 12).padStart(2, "0");
          return `${formattedHours}:${minutes} ${ampm}`;
        } else {
          return ""; // Return empty string if no time component to avoid misleading 08:00 AM
        }
      };

      // Format unified report remarks
      const formatUnifiedRemarks = (report: any) => {
        const generatedData = (report as any).generated_data || {};
        const complaints = generatedData.complaints || [];
        const softwareInstallations = generatedData.software_installations || [];
        const maintenanceServices = generatedData.maintenance_services || [];

        let formattedRemarks = "";

        // Format complaints
        if (complaints.length > 0) {
          // Sort complaints by resolution time (old to latest)
          const sortedComplaints = [...complaints].sort((a, b) => {
            const timeA = new Date(a.resolved_at || a.created_at || 0).getTime();
            const timeB = new Date(b.resolved_at || b.created_at || 0).getTime();
            return timeA - timeB;
          });
          formattedRemarks += "=== COMPLAINTS ===\n";
          sortedComplaints.forEach((c: any) => {
            const time = formatTimeForDisplay(c.resolved_at || c.created_at);
            const assetInfo = c.asset_info ? `[Asset: ${c.asset_info}]` : '';
            const status = c.status ? `(${c.status})` : '';
            const remarks = (c.remarks || c.issue_description || '').replace(/[\r\n]+/g, ' ').trim();
            formattedRemarks += `• ${time} - ${assetInfo} ${status} - Remarks: ${remarks}\n`;
          });
          formattedRemarks += "\n";
        }

        // Format software installations
        if (softwareInstallations.length > 0) {
          // Sort forms by completion time (old to latest)
          const sortedForms = [...softwareInstallations].sort((a, b) => {
            const timeA = new Date(a.completed_at || a.created_at || 0).getTime();
            const timeB = new Date(b.completed_at || b.created_at || 0).getTime();
            return timeA - timeB;
          });
          formattedRemarks += "=== SOFTWARE INSTALLATIONS ===\n";
          sortedForms.forEach((s: any) => {
            const time = formatTimeForDisplay(s.completed_at || s.created_at);
            const softwareInfo = s.software_list ? `Software: ${s.software_list}` : '';
            const facultyInfo = s.faculty_name ? `[Faculty: ${s.faculty_name}]` : '';
            const remarks = (s.installation_remarks || 'no').replace(/[\r\n]+/g, ' ').trim();
            formattedRemarks += `• ${time} - ${softwareInfo} ${facultyInfo} - ${remarks}\n`;
          });
          formattedRemarks += "\n";
        }

        // Format maintenance services
        if (maintenanceServices.length > 0) {
          // Sort maintenance services (old to latest)
          const sortedMaintenance = [...maintenanceServices].sort((a, b) => {
            const timeA = new Date(a.created_at || a.service_date || 0).getTime();
            const timeB = new Date(b.created_at || b.service_date || 0).getTime();
            return timeA - timeB;
          });
          formattedRemarks += "=== MAINTENANCE SERVICES ===\n";
          sortedMaintenance.forEach((m: any) => {
            const time = formatTimeForDisplay(m.created_at || m.service_date); // Prioritize created_at for accurate time
            const workstationName = m.workstation_name || 'Unknown WS';
            const overallRemarks = m.overall_remarks || 'No remarks';
            const performedBy = m.performed_by ? `(by ${m.performed_by})` : '';
            formattedRemarks += `• ${time} - ${workstationName} - ${overallRemarks} ${performedBy}\n`;
          });
        }

        return formattedRemarks || "No unified report data";
      };

      // Compile remarks from all filtered reports
      const compiledData = {
        lab_name: reportsToCompile[0]?.laboratories?.lab_name || "Unknown Lab",
        custodian_name: reportsToCompile[0]?.users?.full_name || "Unknown",
        start_date: formatDateForDisplay(dateFilters.start_date || reportsToCompile[0]?.report_date),
        end_date: formatDateForDisplay(dateFilters.end_date || reportsToCompile[reportsToCompile.length - 1]?.report_date),
        remarks: reportsToCompile.map((report) => {
          // Check if it's a unified report
          const isUnifiedReport = (report as any).report_type === 'unified' || (report as any).generated_data;
          
          return {
            date: new Date(report.report_date).toLocaleDateString(),
            remarks: isUnifiedReport 
              ? formatUnifiedRemarks(report)
              : (report.general_remarks || "No remarks"),
          };
        }),
      };

      // Generate Word document using the template
      console.log("Generating compiled remarks with template:", compiledData);
      await generateTemplateReport(
        "/Compiled_Remarks_Template.docx",
        compiledData,
        `Compiled_Remarks_${compiledData.lab_name}_${new Date(dateFilters.start_date || reportsToCompile[reportsToCompile.length - 1]?.report_date).toISOString().split('T')[0]}_to_${new Date(dateFilters.end_date || reportsToCompile[0]?.report_date).toISOString().split('T')[0]}.docx`
      );

      alert(`Successfully compiled ${reportsToCompile.length} reports!`);
    } catch (error) {
      console.error("Compilation failed:", error);
      alert("Failed to compile remarks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {show && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-black/20 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <div
            className="relative top-10 mx-auto p-0 w-11/12 md:w-4/5 lg:w-3/4 bg-white rounded-lg flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 bg-blue-600 text-white rounded-t-md">
              <h3 className="text-xl font-semibold">
                Daily Accomplishment Report
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={
                    loading ||
                    (generateMode === "single" && !reportData) ||
                    ((generateMode === "all" || generateMode === "compiled") &&
                      getFilteredReports().length === 0)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  {generateMode === "all"
                    ? `Download All (${getFilteredReports().length})`
                    : generateMode === "compiled"
                    ? `Download Compiled (${getFilteredReports().length})`
                    : "Download Word Doc"}
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Generate Mode:
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="single"
                      checked={generateMode === "single"}
                      onChange={() => {
                        setGenerateMode("single");
                      }}
                      className="mr-2"
                    />
                    Single Report
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="all"
                      checked={generateMode === "all"}
                      onChange={() => setGenerateMode("all")}
                      className="mr-2"
                    />
                    All Reports
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="compiled"
                      checked={generateMode === "compiled"}
                      onChange={() => setGenerateMode("compiled")}
                      className="mr-2"
                    />
                    Compiled Remarks
                  </label>
                </div>
              </div>

              {/* Date Filters */}
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700">
                    Filter by Date Range:
                  </h4>
                  <button
                    onClick={() =>
                      setDateFilters({ start_date: "", end_date: "" })
                    }
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateFilters.start_date}
                      onChange={(e) =>
                        setDateFilters((prev) => ({
                          ...prev,
                          start_date: e.target.value,
                        }))
                      }
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateFilters.end_date}
                      onChange={(e) =>
                        setDateFilters((prev) => ({
                          ...prev,
                          end_date: e.target.value,
                        }))
                      }
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Report Selection for Single Mode */}
              {generateMode === "single" && (
                <div className="mt-4 flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    Select Report:
                  </label>
                  <select
                    value={selectedReportId || ""}
                    onChange={(e) => {
                      const reportId = e.target.value
                        ? parseInt(e.target.value)
                        : null;
                      setSelectedReportId(reportId);
                      if (reportId) {
                        loadExistingReport(reportId);
                      }
                    }}
                    className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
                  >
                    <option value="" disabled>
                      Select a report to generate
                    </option>
                    {getFilteredReports().map((report) => (
                      <option key={report.report_id} value={report.report_id}>
                        Report #{report.report_id} -{" "}
                        {new Date(report.report_date).toLocaleDateString()} -{" "}
                        {report.laboratories?.lab_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">
                    {generateMode === "all"
                      ? "Generating all reports..."
                      : generateMode === "compiled"
                      ? "Compiling remarks..."
                      : "Loading report data..."}
                  </p>
                </div>
              ) : generateMode === "compiled" ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">
                      Compiled Remarks Mode
                    </h4>
                    <p className="text-green-700">
                      Ready to compile remarks from {getFilteredReports().length} daily reports into a single document.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">
                      Reports to be compiled:
                    </h5>
                    {getFilteredReports().map((report) => (
                      <div
                        key={report.report_id}
                        className="flex justify-between items-center border rounded p-3"
                      >
                        <div>
                          <span className="font-medium">
                            Report #{report.report_id}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {new Date(report.report_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {report.general_remarks ? (
                            <span className="text-gray-700 truncate max-w-xs">
                              {report.general_remarks.substring(0, 50)}...
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No remarks</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : generateMode === "all" ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      All Reports Mode
                    </h4>
                    <p className="text-blue-700">
                      Ready to generate {getFilteredReports().length} Daily
                      Accomplishment Reports. Each report will be downloaded as
                      a separate Word document.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">
                      Reports to be generated:
                    </h5>
                    {getFilteredReports().map((report) => (
                      <div
                        key={report.report_id}
                        className="flex justify-between items-center border rounded p-3"
                      >
                        <div>
                          <span className="font-medium">
                            Report #{report.report_id}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {new Date(report.report_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {report.laboratories?.lab_name} -{" "}
                          {report.users?.full_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : reportData ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Laboratory
                      </label>
                      <input
                        type="text"
                        value={reportData.lab_name}
                        className="w-full border rounded px-3 py-2 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date and Time
                      </label>
                      <input
                        type="text"
                        value={reportData.current_datetime}
                        className="w-full border rounded px-3 py-2 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conducted by
                      </label>
                      <input
                        type="text"
                        value={reportData.custodian_name}
                        className="w-full border rounded px-3 py-2 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Noted by
                      </label>
                      <input
                        type="text"
                        value={reportData.noted_by}
                        className="w-full border rounded px-3 py-2 bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Procedures Section */}
                  {reportData.procedures &&
                    reportData.procedures.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Procedures
                        </h4>
                        <div className="space-y-3">
                          {reportData.procedures.map((procedure: any) => (
                            <div
                              key={procedure.procedure_id}
                              className="border rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-gray-900">
                                  {procedure.procedure_name}
                                </h5>
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    procedure.overall_status === "Completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {procedure.overall_status}
                                </span>
                              </div>
                              {procedure.overall_remarks && (
                                <div className="mt-3 p-2 bg-blue-50 rounded">
                                  <span className="text-sm font-medium text-blue-900">
                                    Remarks:{" "}
                                  </span>
                                  <span className="text-sm text-blue-700">
                                    {procedure.overall_remarks}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Workstations */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Workstation Status
                    </h4>
                    <div className="space-y-2">
                      {workstations.map((ws) => (
                        <div
                          key={ws.workstation_id}
                          className="flex gap-3 items-center border rounded p-3 bg-gray-50"
                        >
                          <span className="font-medium min-w-[120px]">
                            {ws.workstation_name}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              ws.status === "Working"
                                ? "bg-green-100 text-green-800"
                                : ws.status === "Not Working"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {ws.status}
                          </span>
                          <span className="flex-1 text-sm text-gray-600">
                            {ws.remarks || "No remarks"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      General Remarks
                    </label>
                    <textarea
                      value={reportData.general_remarks}
                      rows={4}
                      className="w-full border rounded px-3 py-2 bg-gray-50"
                      readOnly
                      placeholder="No remarks available"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No report data available
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyAccomplishmentReport;
