import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { generateTemplateReport } from "../../utils/generateTemplateReport";
import { mapReportDataToTemplate } from "../../utils/templateMapping";
import { FileDown } from "lucide-react";

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
  mode?: 'single' | 'all'; // New: single report or all reports mode
}

const DailyAccomplishmentReport: React.FC<Props> = ({ show, onClose, reportId, mode = 'single' }) => {
  const { user } = useAuth();
  const [workstations, setWorkstations] = useState<WorkstationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [availableReports, setAvailableReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [generateMode, setGenerateMode] = useState<'single' | 'all'>('single');

  // Format date for display in modal
  const formatDisplayDateTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Format as MM/DD/YYYY HH:MM AM/PM
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = String(hours % 12 || 12).padStart(2, '0');
      
      return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return '';
    }
  };

  useEffect(() => {
    if (show) {
      setGenerateMode(mode || 'single');
      loadAvailableReports();
      if (reportId) {
        loadExistingReport(reportId);
      }
      // Don't load fresh data - only work with existing reports
    }
  }, [show, reportId, mode]);

  const loadAvailableReports = async () => {
    try {
      let response;
      // Admin can see all reports, custodians only see their lab's reports
      if (user?.role === 'Admin') {
        response = await api.get("/daily-reports");
      } else {
        // For custodians, only get reports from their assigned lab
        response = await api.get(`/daily-reports?lab_id=${user?.lab_id}`);
      }
      
      // Sort reports by newest to oldest (using created_at or report_date)
      const sortedReports = response.data.sort((a: any, b: any) => {
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
      if (user?.role !== 'Admin' && report.lab_id !== user?.lab_id) {
        throw new Error("Access denied: You can only access reports from your assigned laboratory");
      }
      
      // Get lab info to find who assigned the custodian
      const labResponse = await api.get(`/laboratories/${report.lab_id}`);
      const labData = labResponse.data;
      
      // Process workstation data from the report
      const processedWorkstations = report.workstation_items?.map((item: any) => ({
        workstation_id: item.workstation_id,
        workstation_name: item.workstation_name || 'Unknown Workstation',
        status: item.status || 'Working',
        remarks: item.remarks || ''
      })) || [];
      
      setWorkstations(processedWorkstations);
      
      setReportData({
        lab_name: report.laboratories?.lab_name || "Unknown Lab",
        lab_id: report.lab_id, // Add lab_id for template selection
        custodian_name: report.users?.full_name?.toUpperCase() || user?.name?.toUpperCase() || "UNKNOWN",
        noted_by: "DR. MARCO MARVIN L. RADO",
        general_remarks: report.general_remarks || "",
        workstations: processedWorkstations,
        procedures: report.procedures || [], // Add procedures data
        report_id: report.report_id,
        created_at: report.created_at || report.report_date, // Add creation timestamp with fallback
        report_date: report.report_date, // Add report date
        current_datetime: formatDisplayDateTime(report.created_at || report.report_date) // Add formatted display date
      });
      
      console.log("Report data set:", {
        created_at: report.created_at,
        report_date: report.report_date,
        full_report: report
      });
    } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (generateMode === 'all') {
      await generateAllReports();
    } else {
      await generateSingleReport();
    }
  };

  const getLabTemplate = (labId: number): string => {
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
      console.log("Original reportData:", reportData);
      
      // Determine template based on lab_id using helper function
      const templateFile = getLabTemplate(reportData.lab_id);
      console.log(`Using template: ${templateFile} for Lab ${reportData.lab_id}`);
      
      // Map the report data to template format
      const templateData = mapReportDataToTemplate(reportData);
      console.log("Final templateData:", templateData);
      
      await generateTemplateReport(
        templateFile,
        templateData,
        `Daily_Accomplishment_Report_Lab${reportData.lab_id}_${reportData.report_id}_${new Date(reportData.report_date).toISOString().split("T")[0]}.docx`,
      );
    } catch (error) {
      console.error("Download failed:", error);
      alert(`Failed to generate report. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateAllReports = async () => {
    if (availableReports.length === 0) {
      alert("No reports available to generate.");
      return;
    }

    try {
      setLoading(true);
      for (const report of availableReports) {
        // Get detailed report data including workstations and procedures
        const detailedReportResponse = await api.get(`/daily-reports/${report.report_id}`);
        const detailedReport = detailedReportResponse.data;
        
        // Get lab info for the noted_by field
        const labResponse = await api.get(`/laboratories/${report.lab_id}`);
        const labData = labResponse.data;
        
        // Process workstation data
        const processedWorkstations = detailedReport.workstation_items?.map((item: any) => ({
          workstation_name: item.workstation_name || 'Unknown Workstation',
          status: item.status || 'Working',
          remarks: item.remarks || ''
        })) || [];
        
        // Map the report data to template format
        const templateData = mapReportDataToTemplate({
          lab_name: detailedReport.laboratories?.lab_name || "Unknown Lab",
          custodian_name: detailedReport.users?.full_name?.toUpperCase() || "UNKNOWN",
          noted_by: "DR. MARCO MARVIN L. RADO",
          general_remarks: detailedReport.general_remarks || "",
          workstations: processedWorkstations,
          procedures: detailedReport.procedures || [], // Include procedures
          report_id: detailedReport.report_id,
          created_at: detailedReport.created_at || detailedReport.report_date, // Add creation timestamp with fallback
          report_date: detailedReport.report_date // Add report date
        });

        // Determine template based on lab_id using helper function
        const templateFile = getLabTemplate(detailedReport.lab_id);

        await generateTemplateReport(
          templateFile,
          templateData,
          `Daily_Accomplishment_Report_Lab${detailedReport.lab_id}_${detailedReport.report_id}_${new Date(detailedReport.report_date).toISOString().split("T")[0]}.docx`,
        );
      }
      alert(`Successfully generated ${availableReports.length} reports!`);
    } catch (error) {
      console.error("Bulk download failed:", error);
      alert("Failed to generate some reports. Please check if the template exists.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b bg-gray-50 rounded-t-md">
              <h3 className="text-xl font-semibold text-gray-900">
                Daily Accomplishment Report
              </h3>
              <button
                onClick={handleDownload}
                disabled={loading || (generateMode === 'single' && !reportData) || (generateMode === 'all' && availableReports.length === 0)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <FileDown className="w-4 h-4" />
                {generateMode === 'all' ? `Download All (${availableReports.length})` : 'Download Word Doc'}
              </button>
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
                      checked={generateMode === 'single'}
                      onChange={() => {
                        setGenerateMode('single');
                      }}
                      className="mr-2"
                    />
                    Single Report
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="all"
                      checked={generateMode === 'all'}
                      onChange={() => setGenerateMode('all')}
                      className="mr-2"
                    />
                    All Reports
                  </label>
                </div>
              </div>

              {/* Report Selection for Single Mode */}
              {generateMode === 'single' && (
                <div className="mt-4 flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    Select Report:
                  </label>
                  <select
                    value={selectedReportId || ''}
                    onChange={(e) => {
                      const reportId = e.target.value ? parseInt(e.target.value) : null;
                      setSelectedReportId(reportId);
                      if (reportId) {
                        loadExistingReport(reportId);
                      }
                    }}
                    className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
                  >
                    <option value="" disabled>Select a report to generate</option>
                    {availableReports.map((report) => (
                      <option key={report.report_id} value={report.report_id}>
                        Report #{report.report_id} - {new Date(report.report_date).toLocaleDateString()} - {report.laboratories?.lab_name}
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
                    {generateMode === 'all' ? 'Generating all reports...' : 'Loading report data...'}
                  </p>
                </div>
              ) : generateMode === 'all' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">All Reports Mode</h4>
                    <p className="text-blue-700">
                      Ready to generate {availableReports.length} Daily Accomplishment Reports.
                      Each report will be downloaded as a separate Word document.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Reports to be generated:</h5>
                    {availableReports.map((report) => (
                      <div key={report.report_id} className="flex justify-between items-center border rounded p-3">
                        <div>
                          <span className="font-medium">Report #{report.report_id}</span>
                          <span className="text-gray-500 ml-2">
                            {new Date(report.report_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {report.laboratories?.lab_name} - {report.users?.full_name}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Laboratory</label>
                      <input
                        type="text"
                        value={reportData.lab_name}
                        className="w-full border rounded px-3 py-2 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date and Time</label>
                      <input
                        type="text"
                        value={reportData.current_datetime}
                        className="w-full border rounded px-3 py-2 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conducted by</label>
                      <input
                        type="text"
                        value={reportData.custodian_name}
                        className="w-full border rounded px-3 py-2 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Noted by</label>
                      <input
                        type="text"
                        value={reportData.noted_by}
                        className="w-full border rounded px-3 py-2 bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Workstations */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Workstation Status</h4>
                    <div className="space-y-2">
                      {workstations.map((ws) => (
                        <div key={ws.workstation_id} className="flex gap-3 items-center border rounded p-3 bg-gray-50">
                          <span className="font-medium min-w-[120px]">{ws.workstation_name}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            ws.status === 'Working' ? 'bg-green-100 text-green-800' :
                            ws.status === 'Not Working' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ws.status}
                          </span>
                          <span className="flex-1 text-sm text-gray-600">
                            {ws.remarks || 'No remarks'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Procedures Section */}
                  {reportData.procedures && reportData.procedures.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Procedures</h4>
                      <div className="space-y-3">
                        {reportData.procedures.map((procedure: any) => (
                          <div key={procedure.procedure_id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900">{procedure.procedure_name}</h5>
                              <span className={`px-2 py-1 text-xs rounded ${
                                procedure.overall_status === 'Completed' ? 'bg-green-100 text-green-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {procedure.overall_status}
                              </span>
                            </div>
                            {procedure.overall_remarks && (
                              <div className="mt-3 p-2 bg-blue-50 rounded">
                                <span className="text-sm font-medium text-blue-900">Remarks: </span>
                                <span className="text-sm text-blue-700">{procedure.overall_remarks}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">General Remarks</label>
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
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyAccomplishmentReport;
