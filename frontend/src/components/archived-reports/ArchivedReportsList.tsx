//frontend/src/components/archived-reports/ArchivedReportsList.tsx
import React, { useState, useEffect } from "react";
import { getArchivedReports, getDailyReportById } from "../../api/dailyReports";
import type {
  ArchivedReportsResponse,
  DailyReport,
} from "../../api/dailyReports";
import { Archive, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import AdminReportDetailView from "../admin/AdminReportDetailView";
import DailyAccomplishmentReport from "../reports/DailyAccomplishmentReport";
import { Button } from "../ui/button";

const ArchivedReportsList: React.FC = () => {
  const [archivedData, setArchivedData] =
    useState<ArchivedReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(
    null,
  );
  const [showDetailView, setShowDetailView] = useState(false);
  const [showDARModal, setShowDARModal] = useState(false);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
  });

  useEffect(() => {
    loadReports();
  }, [filters, pagination.currentPage, pagination.limit]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getArchivedReports({
        ...filters,
        page: pagination.currentPage,
        limit: pagination.limit,
      });
      setArchivedData(data);
    } catch (_err: any) {
      setError(_err.response?.data?.error || "Failed to load archived reports");
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

  const handleReportUpdated = () => {
    loadReports();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, currentPage: 1 }));
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

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const reports = archivedData?.reports || [];
  const paginationInfo = archivedData?.pagination;

  // Show detail view if a report is selected
  if (showDetailView && selectedReport) {
    return (
      <AdminReportDetailView
        report={selectedReport}
        onBack={handleBackToList}
        onReportUpdated={handleReportUpdated}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading archived reports...</p>
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
              Archived Reports
            </h1>
            <p className="mt-2 text-gray-600">
              View and manage approved daily reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Archive className="w-4 h-4" />
              <span>{paginationInfo?.totalCount || 0} archived reports</span>
            </div>
            <Button
              onClick={() => setShowDARModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate Report
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
              Approved Reports
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filters.start_date || filters.end_date
                ? "Filtered results"
                : "Showing all approved reports"}
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No archived reports found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.start_date || filters.end_date
                ? "No reports match your filter criteria"
                : "No reports have been approved yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report: DailyReport) => (
                  <tr key={report.report_id} className="hover:bg-gray-50">
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
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-green-100 text-green-800 border-green-200">
                        Approved
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(report.created_at || report.report_date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
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
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginationInfo && paginationInfo.totalPages > 1 && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing{" "}
                {(paginationInfo.currentPage - 1) * paginationInfo.limit + 1} to{" "}
                {Math.min(
                  paginationInfo.currentPage * paginationInfo.limit,
                  paginationInfo.totalCount,
                )}{" "}
                of {paginationInfo.totalCount} results
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Items per page:</label>
                <select
                  value={pagination.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
              disabled={!paginationInfo.hasPreviousPage}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: paginationInfo.totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === paginationInfo.currentPage
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
              disabled={!paginationInfo.hasNextPage}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Daily Accomplishment Report Modal */}
      <DailyAccomplishmentReport
        show={showDARModal}
        onClose={() => setShowDARModal(false)}
      />
    </div>
  );
};

export default ArchivedReportsList;
