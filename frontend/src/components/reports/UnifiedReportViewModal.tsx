import React, { useEffect } from "react";
import { Button } from "../ui/button";
import type { DailyReport } from "../../api/dailyReports";

interface UnifiedReportViewModalProps {
  report: DailyReport | null;
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedReportViewModal: React.FC<UnifiedReportViewModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  // Add ESC key support
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!report || !isOpen) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = String(hours % 12 || 12).padStart(2, "0");

    return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generatedData = (report as any).generated_data || {};
  const complaints = generatedData.complaints || [];
  const softwareInstallations = generatedData.software_installations || [];
  const procedures = (report as any).procedures || [];
  const complaintsRemarks = generatedData.complaints_remarks || '';
  const formsRemarks = generatedData.forms_remarks || '';
  
  // Separate procedures by type (procedure_id 5 & 6 for complaints, 2 for software)
  const complaintsProcedures = procedures.filter((p: any) => p.procedure_id === 5 || p.procedure_id === 6);
  const formsProcedures = procedures.filter((p: any) => p.procedure_id === 2);
  
  // For complaints, create workstation items from the complaints data itself (without remarks)
  const complaintsWorkstations = complaints.map((c: any) => ({
    workstation_name: c.workstation_name || c.workstations?.workstation_name || 'Unknown Workstation',
    remarks: null // No remarks in workstation area
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <button
            onClick={onClose}
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
            Unified Daily Report
          </h1>
          <p className="mt-2 text-gray-600">
            Report #{report.report_id} • {formatDate(report.report_date)} • Created{" "}
            {formatDateTime(report.created_at || report.report_date)}
          </p>
        </div>
      </div>

      {/* Single Page Report View */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
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
              <div className="text-sm font-medium text-gray-600">Date</div>
              <div className="text-xl font-bold text-gray-900">
                {formatDate(report.report_date)}
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
                  {report.users?.full_name || ""}
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

          {/* Complaints Section */}
          {complaints.length > 0 ? (
            <div className="space-y-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
                📋 Complaints Section
              </h2>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ✅ Procedures ({complaintsProcedures.filter((p: any) => p.overall_status === "Completed").length})
                </h3>
                {complaintsProcedures.length > 0 ? (
                  <div className="space-y-3">
                    {complaintsProcedures
                      .filter((proc: any) => proc.overall_status === "Completed")
                      .map((proc: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded border border-gray-200"
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
                  <div className="text-center py-4 bg-white rounded border border-gray-200">
                    <p className="text-gray-500">No procedures reported</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  💻 Workstations ({complaintsWorkstations.length})
                </h3>
                {complaintsWorkstations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {complaintsWorkstations.map((workstation: any, index: number) => (
                      <div
                        key={index}
                        className="bg-white px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700"
                      >
                        {workstation.workstation_name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white rounded border border-gray-200">
                    <p className="text-gray-500">No workstations reported</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  📝 Remarks
                </h3>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">{complaintsRemarks}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
              <p className="text-gray-500 text-center">No complaints data found in this unified report</p>
            </div>
          )}

          {/* Forms Section */}
          {softwareInstallations.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
                📝 Software Installations Section
              </h2>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ✅ Procedures ({formsProcedures.filter((p: any) => p.overall_status === "Completed").length})
                </h3>
                {formsProcedures.length > 0 ? (
                  <div className="space-y-3">
                    {formsProcedures
                      .filter((proc: any) => proc.overall_status === "Completed")
                      .map((proc: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded border border-gray-200"
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
                  <div className="text-center py-4 bg-white rounded border border-gray-200">
                    <p className="text-gray-500">No procedures reported</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  📝 Remarks
                </h3>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">{formsRemarks}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-center">No software installations data found in this unified report</p>
            </div>
          )}

          {/* Report Info */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Unified report created on{" "}
                {formatDateTime(report.created_at || report.report_date)}
              </div>
              <Button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedReportViewModal;
