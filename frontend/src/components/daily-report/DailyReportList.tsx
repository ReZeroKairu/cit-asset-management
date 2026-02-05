//frontend/src/components/daily-report/DailyReportList.tsx
import React, { useState, useEffect } from "react";
import {
  getAllDailyReports,
  getMyDailyReports,
  getDailyReportById,
} from "../../api/dailyReports";
import type { DailyReport } from "../../api/dailyReports";
import DailyReportFormTab from "./DailyReportFormTab";
import DailyReportViewModal from "./DailyReportViewModal";
import DailyAccomplishmentReport from "../reports/DailyAccomplishmentReport";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { FileText } from "lucide-react";

interface DailyReportListProps {
  viewMode?: "my" | "all";
  adminMode?: boolean;
}

const DailyReportList: React.FC<DailyReportListProps> = ({
  viewMode = "my",
  adminMode = false,
}) => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [editingReport, setEditingReport] = useState<DailyReport | undefined>();
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showDARModal, setShowDARModal] = useState(false);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
  });

  const { user } = useAuth();

  useEffect(() => {
    loadReports();
  }, [viewMode, filters]);

  const loadReports = async () => {
    try {
      setLoading(true);

      const data =
        viewMode === "my"
          ? await getMyDailyReports()
          : await getAllDailyReports();
      setReports(data);
    } catch (_err: any) {
      setError(_err.response?.data?.error || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report: DailyReport) => {
    setEditingReport(report);
    setActiveTab("create");
  };

  const handleFormSuccess = () => {
    setActiveTab("list");
    setEditingReport(undefined);
    loadReports();
  };

  const handleFormCancel = () => {
    setActiveTab("list");
    setEditingReport(undefined);
  };

  const handleView = (report: DailyReport) => {
    // Fetch detailed report data including workstations and procedures
    getDailyReportById(report.report_id)
      .then((detailedReport) => {
        setViewingReport(detailedReport);
        setIsViewModalOpen(true);
      })
      .catch((_err) => {
        setError("Failed to load report details");
      });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const filteredReports = reports.filter((report) => {
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

  // Show detail view if a report is selected
  if (isViewModalOpen && viewingReport) {
    return (
      <DailyReportViewModal
        report={viewingReport}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingReport(null);
        }}
      />
    );
  }

  // Show form content if creating/editing
  if (activeTab === "create") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyReportFormTab
          report={editingReport}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
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
            <h1 className="text-3xl font-bold text-gray-900">
              {viewMode === "my" ? "My Daily Reports" : "All Daily Reports"}
            </h1>
            <p className="mt-2 text-gray-600">
              {viewMode === "my"
                ? "View and manage your daily reports"
                : "View all daily reports"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!adminMode && (
              <Button
                onClick={() => setActiveTab("create")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create New Report
              </Button>
            )}
            <Button
              onClick={() => setShowDARModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate DAR Report
            </Button>
          </div>
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
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === "my" ? "My Daily Reports" : "All Daily Reports"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filters.start_date || filters.end_date
                ? "Filtered results"
                : "Showing all pending reports"}
            </p>
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2v5a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custodian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Laboratory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.report_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Report #{report.report_id}
                      </div>
                      {report.general_remarks && (
                        <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                          {report.general_remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.users?.full_name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.users?.email || "No email"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.laboratories?.lab_name || "Unknown Lab"}
                      </div>
                      {report.laboratories?.location && (
                        <div className="text-sm text-gray-500">
                          {report.laboratories.location}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(report.status || "Pending")}`}
                      >
                        {report.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(report.created_at || report.report_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleView(report)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <svg
                          className="w-5 h-5 inline mr-1"
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
                        View
                      </button>
                      {viewMode === "my" && report.status === "Pending" && (
                        <button
                          onClick={() => handleEdit(report)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <svg
                            className="w-5 h-5 inline mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                      )}
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
      />
    </div>
  );
};

export default DailyReportList;
