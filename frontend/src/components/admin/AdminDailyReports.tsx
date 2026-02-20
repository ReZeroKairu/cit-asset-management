//frontend/src/components/admin/AdminDailyReports.tsx
import React, { useState, useEffect } from "react";
import type { DailyReport } from "../../api/dailyReports";
import {
  getAllDailyReports,
  getDailyReportById,
  updateDailyReport,
} from "../../api/dailyReports";
import AdminReportDetailView from "../admin/AdminReportDetailView";
import { CheckSquare, Square, FileText, Download } from "lucide-react";
import DailyAccomplishmentReport from "../reports/DailyAccomplishmentReport";
import { generateTemplateReport } from "../../utils/generateTemplateReport";
import { mapReportDataToTemplate } from "../../utils/templateMapping";
import api from "../../api/axios";

interface AdminDailyReportsProps {}

const AdminDailyReports: React.FC<AdminDailyReportsProps> = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(
    null,
  );
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [showDARModal, setShowDARModal] = useState(false);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      console.log('Loading admin daily reports...');
      // For admin view, show only pending reports
      const data = await getAllDailyReports({ status: "Pending" });
      console.log('Admin reports data received:', data);
      setReports(data.data || data);
    } catch (err: any) {
      console.error('Error loading admin reports:', err);
      setError(err.response?.data?.error || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (report: DailyReport) => {
    try {
      // Fetch detailed report data including workstations and procedures
      const detailedReport = await getDailyReportById(report.report_id);
      setSelectedReport(detailedReport);
      setShowDetailView(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load report details");
    }
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedReport(null);
  };

  const handleQuickApprove = async (reportId: number) => {
    try {
      await updateDailyReport(reportId, { status: "Approved" });
      loadReports();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to approve report");
    }
  };

  const handleSelectAll = () => {
    const pendingReports = filteredReports.filter(
      (report) => report.status === "Pending",
    );
    if (selectedReports.length === pendingReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(pendingReports.map((report) => report.report_id));
    }
  };

  const handleSelectReport = (reportId: number) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId],
    );
  };

  const handleApproveAll = async () => {
    if (selectedReports.length === 0) {
      alert("Please select at least one report to approve");
      return;
    }

    try {
      setLoading(true);
      const promises = selectedReports.map((reportId) =>
        updateDailyReport(reportId, { status: "Approved" }),
      );
      await Promise.all(promises);
      setSelectedReports([]);
      loadReports();
      alert(`Successfully approved ${selectedReports.length} reports`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to approve reports");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
    });
  };

  console.log('AdminDailyReports render - reports:', reports, 'loading:', loading, 'error:', error);

  const filteredReports = (reports || []).filter((report) => {
    let matchesFilter = true;

    // Start date filter
    if (filters.start_date) {
      const reportDate = new Date(report.report_date);
      const startDate = new Date(filters.start_date);
      if (reportDate < startDate) {
        matchesFilter = false;
      }
    }

    // End date filter
    if (filters.end_date) {
      const reportDate = new Date(report.report_date);
      const endDate = new Date(filters.end_date);
      if (reportDate > endDate) {
        matchesFilter = false;
      }
    }

    return matchesFilter;
  });

  const handleReportUpdated = () => {
    loadReports();
  };

  const handleGenerateReport = async (report: DailyReport) => {
    try {
      console.log("Generating report for:", report.report_id);
      
      // Show loading state
      setError("");
      
      // Check if report_id exists
      if (!report.report_id) {
        throw new Error("Report ID is missing");
      }
      
      // Use the same API call as DailyAccomplishmentReport that works
      console.log("Fetching detailed report data for ID:", report.report_id);
      const response = await api.get(`/daily-reports/${report.report_id}`);
      const detailedReport = response.data;
      
      console.log("Detailed report data:", detailedReport);
      
      // Check if detailedReport exists and has the expected structure
      if (!detailedReport) {
        console.error("No data returned from API");
        throw new Error("API returned no data for this report");
      }
      
      // Process workstation data in same way as DailyAccomplishmentReport
      const processedWorkstations = detailedReport.workstation_items?.map((item: any) => ({
        workstation_id: item.workstation_id,
        workstation_name: item.workstation_name || 'Unknown Workstation',
        status: item.status || 'Working',
        remarks: item.remarks || ''
      })) || [];
      
      console.log("Processed workstations:", processedWorkstations);
      
      // Use procedures data directly from API response
      const proceduresData = detailedReport.procedures || [];
      console.log("Procedures data:", proceduresData);
      
      // Map the report data to template format in same way as DailyAccomplishmentReport
      const templateData = mapReportDataToTemplate({
        lab_name: detailedReport.laboratories?.lab_name || "Unknown Lab",
        lab_id: detailedReport.lab_id,
        custodian_name: detailedReport.users?.full_name?.toUpperCase() || "UNKNOWN",
        noted_by: "DR. MARCO MARVIN L. RADO",
        general_remarks: detailedReport.general_remarks || "",
        workstations: processedWorkstations,
        procedures: proceduresData,
        report_id: detailedReport.report_id,
        created_at: detailedReport.created_at || detailedReport.report_date,
        report_date: detailedReport.report_date
      });
      
      console.log("Template data:", templateData);
      
      // Determine template based on lab_id
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
      
      const templateFile = getLabTemplate(detailedReport.lab_id);
      const reportDate = detailedReport.report_date ? new Date(detailedReport.report_date) : new Date();
      const fileName = `Daily_Accomplishment_Report_Lab${detailedReport.lab_id}_${detailedReport.report_id}_${reportDate.toISOString().split("T")[0]}.docx`;
      
      console.log("Using template:", templateFile);
      console.log("File name:", fileName);
      
      // Generate and download the report
      await generateTemplateReport(templateFile, templateData, fileName);
      
      console.log("Report generated successfully!");
      
    } catch (error) {
      console.error("Failed to generate report:", error);
      setError(`Failed to generate report. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDateTime = (dateString: string) => {
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
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Show detail view if a report is selected
  if (showDetailView && selectedReport) {
    return (
      <AdminReportDetailView
        report={selectedReport}
        onBack={handleBackToList}
        onReportUpdated={loadReports}
      />
    );
  }

  // Show reports list
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading daily reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Reports</h1>
            <p className="mt-2 text-gray-600">
              Review and manage all custodian daily reports
            </p>
          </div>
          <button
            onClick={() => setShowDARModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate DAR Report
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                All Daily Reports
              </h2>
              <p className="text-sm text-gray-500">
                {filters.start_date || filters.end_date
                  ? "Filtered results"
                  : "Showing all pending reports"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {filteredReports.some((r) => r.status === "Pending") && (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 flex items-center gap-2 cursor-pointer"
                  >
                    {selectedReports.length ===
                    filteredReports.filter((r) => r.status === "Pending")
                      .length ? (
                      <>
                        <Square className="w-4 h-4" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        Select All Pending
                      </>
                    )}
                  </button>
                  {selectedReports.length > 0 && (
                    <button
                      onClick={handleApproveAll}
                      disabled={loading}
                      className="px-3 py-1 text-sm font-medium text-white bg-green-600 border border-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve Selected ({selectedReports.length})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2v5a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No reports found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.start_date || filters.end_date
                ? "No reports match your filter criteria"
                : "No pending daily reports have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedReports.length ===
                          filteredReports.filter((r) => r.status === "Pending")
                            .length &&
                        filteredReports.some((r) => r.status === "Pending")
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Report Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    Custodian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    Laboratory
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.report_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {report.status === "Pending" && (
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.report_id)}
                          onChange={() => handleSelectReport(report.report_id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        Report #{report.report_id}
                      </div>
                      {report.general_remarks && (
                        <div className="text-sm text-gray-500 mt-1 truncate">
                          {report.general_remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {report.users?.full_name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {report.users?.email || "No email"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {report.laboratories?.lab_name || "Unknown Lab"}
                      </div>
                      {report.laboratories?.location && (
                        <div className="text-sm text-gray-500 truncate">
                          {report.laboratories.location}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(report.status || "Pending")}`}
                      >
                        {report.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(report.created_at || report.report_date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="text-blue-600 hover:text-blue-900 flex items-center px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                          title="View Report Details"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleGenerateReport(report)}
                          className="text-green-600 hover:text-green-900 flex items-center px-2 py-1 rounded hover:bg-green-50 transition-colors cursor-pointer"
                          title="Generate Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {report.status !== "Approved" && (
                          <button
                            onClick={() => handleQuickApprove(report.report_id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Accomplishment Report Modal */}
      <DailyAccomplishmentReport
        show={showDARModal}
        onClose={() => setShowDARModal(false)}
        archiveMode={false}
        pageContext={'daily-reports'}
      />
    </div>
  );
};

export default AdminDailyReports;
