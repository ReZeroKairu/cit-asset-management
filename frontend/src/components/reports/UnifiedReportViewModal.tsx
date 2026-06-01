import React, { useCallback, useEffect } from "react";
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
  const safeOnClose = useCallback(() => {
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [onClose]);

  // Add ESC key support
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        safeOnClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, safeOnClose]);

  const reportData = report as any;
  if (!reportData || !isOpen) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = String(hours % 12 || 12).padStart(2, "0");

    return `${month} ${day}, ${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  const generatedData = reportData.generated_data || {};
  const complaints = generatedData.complaints || [];
  const softwareInstallations = generatedData.software_installations || [];
  const maintenanceServices = generatedData.maintenance_services || [];
  const inventoryWorkstations = (generatedData.inventory_workstations || []).slice();
  const procedures = reportData.procedures || [];
  const complaintsRemarks = generatedData.complaints_remarks || '';
  const formsRemarks = generatedData.forms_remarks || '';
  const maintenanceRemarks = generatedData.maintenance_remarks || '';
  const inventoryRemarks = generatedData.inventory_remarks || '';

  // Function to aggregate procedures from source records to ensure correct section grouping
  const getSectionProcedures = (items: any[], defaultDarIds: number[]) => {
    const sectionProcIds = new Set<number>();
    if (items.length === 0) return [];

    items.forEach(item => {
      // Collect procedure IDs from metadata (handling both procedure_ids and procedures array)
      const itemProcs = item.procedure_ids || item.procedures || [];
      if (Array.isArray(itemProcs)) {
        itemProcs.forEach((p: any) => {
          const id = typeof p === 'object' ? Number(p.procedure_id) : Number(p);
          if (id) sectionProcIds.add(id);
        });
      }
    });

    // Fallback to section defaults if records exist but have no specific procedure metadata
    if (sectionProcIds.size === 0) {
      defaultDarIds.forEach(id => sectionProcIds.add(id));
    }

    return procedures.filter((p: any) => sectionProcIds.has(Number(p.procedure_id)));
  };

  const complaintsProcedures = getSectionProcedures(complaints, [5, 6]);
  const formsProcedures = getSectionProcedures(softwareInstallations, [2]);
  // Maintenance section shows aggregated log procedures plus general checks (1, 3, 4, 7)
  const maintenanceProcedures = getSectionProcedures(maintenanceServices, [1, 3, 4, 7]);

  // Helper to sort workstations numerically (e.g., WS-1, WS-2, WS-10)
  const sortWorkstations = (a: any, b: any) => {
    const numA = parseInt(a.workstation_name?.match(/\d+/)?.[0] || "0");
    const numB = parseInt(b.workstation_name?.match(/\d+/)?.[0] || "0");
    return numA - numB;
  };

  // For complaints, create workstation items from the complaints data itself (without remarks)
  const complaintsWorkstations = complaints.map((c: any) => ({
    workstation_name: c.workstation_name || c.workstations?.workstation_name || 'Unknown Workstation',
    remarks: null // No remarks in workstation area
  })).sort(sortWorkstations);

  // For inventory procedures (ID 5 = Hardware Checks)
  const inventoryProcedures = procedures.filter((p: any) => Number(p.procedure_id) === 5);

  // For software installations, create workstation items - flatten the workstations array
  const softwareWorkstations = softwareInstallations
    .flatMap((s: any) => 
      (s.workstations && Array.isArray(s.workstations)) 
        ? s.workstations.map((ws: any) => ({
            workstation_name: ws.workstation_name || 'Unknown Workstation',
            remarks: null
          }))
        : [{
            workstation_name: s.workstation_name || 'Unknown Workstation',
            remarks: null
          }]
    )
    // Deduplicate workstations
    .filter((ws: any, index: number, self: any[]) => 
      index === self.findIndex((w: any) => w.workstation_name === ws.workstation_name)
    )
    .sort(sortWorkstations);

  // For maintenance services, create workstation items
  const maintenanceWorkstations = maintenanceServices.map((m: any) => ({
    workstation_name: m.workstation_name || m.workstations?.workstation_name || m.pmc_reports?.workstations?.workstation_name || 'Unknown Workstation',
    remarks: null
  })).sort(sortWorkstations);

  const sortedInventoryWorkstations = inventoryWorkstations.sort(sortWorkstations);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <button
            onClick={safeOnClose}
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
            Report #{reportData.report_id} • Created{" "}
            {formatDateTime(reportData.created_at || reportData.report_date)}
          </p>
        </div>
      </div>

      {/* Single Page Report View */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Report Header */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-gray-600">Report ID</div>
              <div className="text-xl font-bold text-gray-900">
                #{reportData.report_id}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Status</div>
              <span
                className={`inline-flex px-3 py-1 text-sm font-bold rounded-full border ${
                  reportData.status === "Approved"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }`}
              >
                {reportData.status || "Pending"}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Created</div>
              <div className="text-xl font-bold text-gray-900">
                {formatDateTime(reportData.created_at || reportData.report_date)}
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6 space-y-6">
          {/* Custodian & Laboratory Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                👤 Custodian
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {reportData.users?.full_name || ""}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {reportData.users?.email || "No email"}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🏢 Laboratory
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Lab:</span>{" "}
                  {reportData.laboratories?.lab_name || "Unknown Lab"}
                </div>
                <div>
                  <span className="font-medium">Location:</span>{" "}
                  {reportData.laboratories?.location || "No location"}
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
                {reportData.procedures && Array.isArray(reportData.procedures) && reportData.procedures.length > 0 ? (
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
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    📝 Remarks
                  </h3>
                </div>
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
                  💻 Workstations ({softwareWorkstations.length})
                </h3>
                {softwareWorkstations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {softwareWorkstations.map((workstation: any, index: number) => (
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
                  📝 Software Installations Remarks
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

          {/* Maintenance Section */}
          {maintenanceServices.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
                🔧 Maintenance Section
              </h2>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ✅ Procedures ({maintenanceProcedures.filter((p: any) => p.overall_status === "Completed").length})
                </h3>
                {maintenanceProcedures.length > 0 ? (
                  <div className="space-y-3">
                    {maintenanceProcedures
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
                  💻 Workstations ({maintenanceWorkstations.length})
                </h3>
                {maintenanceWorkstations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {maintenanceWorkstations.map((workstation: any, index: number) => (
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
                  📝 Maintenance Remarks
                </h3>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">{maintenanceRemarks}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-center">No maintenance services data found in this unified report</p>
            </div>
          )}

          {(inventoryRemarks || sortedInventoryWorkstations.length > 0) ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
                📦 Inventory Section
              </h2>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ✅ Procedures ({inventoryProcedures.filter((p: any) => p.overall_status === "Completed").length})
                </h3>
                {inventoryProcedures.length > 0 ? (
                  <div className="space-y-3">
                    {inventoryProcedures
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
                  💻 Workstations ({sortedInventoryWorkstations.length})
                </h3>
                {sortedInventoryWorkstations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sortedInventoryWorkstations.map((workstation: any, index: number) => (
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
                  📝 Inventory Remarks
                </h3>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">{inventoryRemarks}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-center">No inventory data found in this unified report</p>
            </div>
          )}

          {/* Report Info */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Unified report created on{" "}
                {formatDateTime(reportData.created_at || reportData.report_date)}
              </div>
              <Button
                onClick={safeOnClose}
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
