// frontend/src/components/admin/AdminReportDetailView.tsx
import React, { useState } from "react";
import type { DailyReport } from "../../api/dailyReports";
import { updateDailyReport } from "../../api/dailyReports";
import { Button } from "../ui/button";

interface AdminReportDetailViewProps {
  report: DailyReport;
  onBack: () => void;
  onReportUpdated: () => void;
}

const AdminReportDetailView: React.FC<AdminReportDetailViewProps> = ({
  report,
  onBack,
  onReportUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleApproveReport = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      await updateDailyReport(report.report_id, { status: "Approved" });

      // Show success message
      setSuccessMessage(
        `Report #${report.report_id} has been successfully approved!`,
      );

      // Update the reports list
      onReportUpdated();

      // Go back to reports list after 2 seconds
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to approve report");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Reports
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Daily Report Details
          </h1>
          <p className="mt-2 text-gray-600">
            Report #{report.report_id} • Created{" "}
            {formatDateTime(report.created_at || report.report_date)}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 animate-pulse">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {successMessage}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Single Page Report View */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-gray-600">Report ID</div>
              <div className="text-xl font-bold text-gray-900">
                #{report.report_id}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Status</div>
              <span
                className={`inline-flex px-3 py-1 text-sm font-bold rounded-full border ${
                  report.status === "Approved"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }`}
              >
                {report.status || "Pending"}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Created</div>
              <div className="text-xl font-bold text-gray-900">
                {formatDateTime(report.created_at || report.report_date)}
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6 space-y-6">
          {/* Custodian & Laboratory Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                👤 Custodian
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {report.users?.full_name || "Unknown"}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {report.users?.email || "No email"}
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🏢 Laboratory
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Lab:</span>{" "}
                  {report.laboratories?.lab_name || "Unknown Lab"}
                </div>
                <div>
                  <span className="font-medium">Location:</span>{" "}
                  {report.laboratories?.location || "No location"}
                </div>
              </div>
            </div>
          </div>

          {/* Procedures */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ✅ Procedures ({report.procedures?.length || 0})
            </h3>
            {report.procedures && report.procedures.length > 0 ? (
              <div className="space-y-3">
                {report.procedures.map((proc: any, index: number) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded border border-purple-100"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        {proc.procedure_name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          proc.overall_status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {proc.overall_status === "Completed"
                          ? "✓ Completed"
                          : "○ Pending"}
                      </span>
                    </div>
                    {proc.overall_remarks && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span>{" "}
                        {proc.overall_remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-white rounded border border-purple-100">
                <p className="text-gray-500">No procedures reported</p>
              </div>
            )}
          </div>

          {/* Workstations */}
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              💻 Workstations ({report.workstation_items?.length || 0})
            </h3>
            {report.workstation_items && report.workstation_items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.workstation_items.map((workstation, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded border border-emerald-100"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        {workstation.workstation_name}
                      </span>
                    </div>
                    {workstation.remarks && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span>{" "}
                        {workstation.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-white rounded border border-emerald-100">
                <p className="text-gray-500">No workstations reported</p>
              </div>
            )}
          </div>

          {/* Remarks - Moved to Bottom */}
          {report.general_remarks && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📝 Remarks
              </h3>
              <div className="bg-white p-3 rounded border border-amber-100">
                <p className="text-gray-700">{report.general_remarks}</p>
              </div>
            </div>
          )}

          {/* Action Buttons - Moved to Bottom */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Report submitted on {formatDate(report.report_date)}
              </div>
              <div className="flex space-x-3">
                {report.status !== "Approved" && (
                  <Button
                    onClick={handleApproveReport}
                    disabled={loading || successMessage !== ""}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading
                      ? "Approving..."
                      : successMessage
                        ? "Approved!"
                        : "Approve Report"}
                  </Button>
                )}
                <Button
                  onClick={onBack}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportDetailView;
