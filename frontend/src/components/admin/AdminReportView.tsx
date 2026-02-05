// frontend/src/components/admin/AdminReportView.tsx
import React, { useState } from "react";
import type { DailyReport } from "../../api/dailyReports";
import { updateDailyReport } from "../../api/dailyReports";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface AdminReportViewProps {
  report: DailyReport;
  isOpen: boolean;
  onClose: () => void;
  onReportUpdated: () => void;
}

const AdminReportView: React.FC<AdminReportViewProps> = ({
  report,
  isOpen,
  onClose,
  onReportUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApproveReport = async () => {
    try {
      setLoading(true);
      setError("");

      await updateDailyReport(report.report_id, {
        status: "Approved",
      });

      onReportUpdated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to approve report");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border-2 border-gray-200 shadow-2xl">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Daily Report Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Report Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                  Report ID
                </div>
                <div className="text-lg font-bold text-gray-900">
                  #{report.report_id}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                  Status
                </div>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-bold rounded-full border ${getStatusColor(report.status || "Pending")}`}
                >
                  {report.status === "Approved" ? (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Approved
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Pending
                    </span>
                  )}
                </span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                  Report Date
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatDate(report.report_date)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                  Created
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {report.created_at
                    ? new Date(report.created_at).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Custodian Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Custodian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">
                  Name
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {report.users?.full_name || "Unknown"}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">
                  Email
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {report.users?.email || "No email"}
                </div>
              </div>
            </div>
          </div>

          {/* Laboratory Information */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Laboratory Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
                <div className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
                  Laboratory
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {report.laboratories?.lab_name || "Unknown Lab"}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
                <div className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
                  Location
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {report.laboratories?.location || "No location"}
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {report.general_remarks && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border border-amber-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-amber-600"
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
                Remarks
              </h3>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-100">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {report.general_remarks}
                </p>
              </div>
            </div>
          )}

          {/* Procedures */}
          {report.procedures && report.procedures.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Procedures
              </h3>
              <div className="space-y-4">
                {report.procedures.map((proc: any, index: number) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg shadow-sm border border-purple-100"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-purple-600 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <h4 className="font-semibold text-gray-900">
                          {proc.procedure_name}
                        </h4>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                          proc.overall_status === "Completed"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-gray-100 text-gray-800 border border-gray-200"
                        }`}
                      >
                        {proc.overall_status === "Completed" ? (
                          <span className="flex items-center">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Completed
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Pending
                          </span>
                        )}
                      </span>
                    </div>

                    {proc.overall_remarks && (
                      <div className="mb-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        <span className="font-medium">Notes:</span>{" "}
                        {proc.overall_remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workstations */}
          {report.workstation_items && report.workstation_items.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Workstation Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.workstation_items.map((workstation, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-emerald-600 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <h4 className="font-semibold text-gray-900">
                          {workstation.workstation_name}
                        </h4>
                      </div>
                    </div>
                    {workstation.remarks && (
                      <div className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                        <span className="font-medium">Notes:</span>{" "}
                        {workstation.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Report submitted on {formatDate(report.report_date)}
            </div>
            <div className="flex space-x-3">
              {report.status !== "Approved" && (
                <Button
                  onClick={handleApproveReport}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? "Approving..." : "Approve Report"}
                </Button>
              )}
              <Button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminReportView;
