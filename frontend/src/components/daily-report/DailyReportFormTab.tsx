// frontend/src/components/daily-report/DailyReportFormTab.tsx
import React, { useState, useEffect } from "react";
import {
  getUserAssignedLab,
  createDailyReport,
  updateDailyReport,
} from "../../api/dailyReports";
import {
  getAllProcedures,
  getReportProcedures,
  saveReportProcedures,
} from "../../api/procedures";
import { getLabWorkstationsForReport } from "../../api/workstationReports";
import api from "../../api/axios";
import type { DailyReport } from "../../api/dailyReports";
import type { Procedure, ReportProcedure } from "../../api/procedures";

interface DailyReportFormTabProps {
  report?: DailyReport;
  onSuccess: () => void;
  onCancel: () => void;
}

const DailyReportFormTab: React.FC<DailyReportFormTabProps> = ({
  report,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    lab_id: report?.lab_id || 0,
    report_date: report?.report_date || new Date().toISOString().split("T")[0],
    general_remarks: report?.general_remarks || "",
  });

  const [assignedLab, setAssignedLab] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProcedureDropdownOpen, setIsProcedureDropdownOpen] = useState(false);
  const [workstationSearch, setWorkstationSearch] = useState("");
  const [procedureSearch, setProcedureSearch] = useState("");
  const [procedures, setProcedures] = useState<ReportProcedure[]>([]);
  const [workstations, setWorkstations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAssignedLab();
    loadProcedures();
    if (report) {
      loadReportProcedures(report.report_id);
    }
  }, []);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen) {
        const dropdown = document.getElementById("workstation-dropdown");
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      }
      if (isProcedureDropdownOpen) {
        const dropdown = document.getElementById("procedure-dropdown");
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsProcedureDropdownOpen(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isDropdownOpen, isProcedureDropdownOpen]);

  // Load workstations when lab_id changes
  useEffect(() => {
    if (formData.lab_id) {
      loadWorkstations(formData.lab_id);
    }
  }, [formData.lab_id, report]);

  const loadProcedures = async () => {
    try {
      const data = await getAllProcedures();

      // ✅ FILTER: Only show DAR category procedures
      const darProcedures = data.filter((proc: any) => proc.category === "DAR");

      const initializedProcedures = darProcedures.map((proc: Procedure) => ({
        ...proc,
        overall_status: "Pending",
        overall_remarks: "",
        checklists: [],
      }));
      setProcedures(initializedProcedures);
    } catch (err: any) {
      console.error("Failed to load procedures:", err);
    }
  };

  const loadReportProcedures = async (reportId: number) => {
    try {
      // Load all available procedures
      const allProcedures = await getAllProcedures();

      // ✅ FILTER: Only keep DAR category procedures
      const darProcedures = allProcedures.filter(
        (proc: any) => proc.category === "DAR",
      );

      try {
        // Fetch saved data for this report
        const reportData = await api.get(`/daily-reports/${reportId}`);
        const savedProcedures = reportData.data.procedures || [];

        // Merge filtered DAR procedures with their saved status
        const mergedProcedures = darProcedures.map((proc: Procedure) => {
          const savedProc = savedProcedures.find(
            (sp: any) => sp.procedure_id === proc.procedure_id,
          );
          const status = savedProc ? savedProc.overall_status : "Pending";
          return {
            ...proc,
            overall_status: status,
            overall_remarks: savedProc ? savedProc.overall_remarks : "",
            checklists: [],
          };
        });

        setProcedures(mergedProcedures);
      } catch (apiError: any) {
        console.error("API Error fetching specific report details:", apiError);
        // Fallback: just use default DAR procedures
        const fallbackProcedures = darProcedures.map((proc: Procedure) => ({
          ...proc,
          overall_status: "Pending",
          overall_remarks: "",
          checklists: [],
        }));
        setProcedures(fallbackProcedures);
      }
    } catch (err: any) {
      console.error("Failed to load report procedures:", err);
    }
  };

  const loadWorkstations = async (labId: number) => {
    try {
      const reportId = report?.report_id;
      const data = await getLabWorkstationsForReport(labId, reportId);
      setWorkstations(data);
    } catch (err: any) {
      console.error("Failed to load workstations:", err);
    }
  };

  const loadAssignedLab = async () => {
    try {
      const data = await getUserAssignedLab();
      setAssignedLab(data.assigned_lab);

      if (data.assigned_lab) {
        setFormData((prev) => ({
          ...prev,
          lab_id: data.assigned_lab.lab_id,
        }));
      }
    } catch (err: any) {
      console.error("API Error:", err);
      setError("Failed to load assigned laboratory");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!assignedLab) {
      setError("You must be assigned to a laboratory to create reports");
      setLoading(false);
      return;
    }

    try {
      const submitData = { ...formData };

      let createdReport;
      if (report) {
        await updateDailyReport(report.report_id, submitData);
        createdReport = { report_id: report.report_id };
      } else {
        createdReport = await createDailyReport(submitData);
      }

      // Save workstation data
      const checkedWorkstations = workstations.filter((ws) => ws.checked);
      if (checkedWorkstations.length > 0) {
        await api.post(
          `/daily-reports/${createdReport.report_id}/workstations`,
          {
            reportId: createdReport.report_id,
            workstations: checkedWorkstations.map((ws) => ({
              workstation_id: ws.workstation_id,
              status: ws.status || "Working",
              remarks: ws.remarks || null,
            })),
          },
        );
      }

      // Save procedures data
      const checkedProcedures = procedures.filter(
        (proc) => proc.overall_status === "Completed",
      );

      if (checkedProcedures.length > 0) {
        const proceduresData = checkedProcedures.map((proc) => ({
          procedure_id: proc.procedure_id,
          overall_status: proc.overall_status || "Pending",
          overall_remarks: proc.overall_remarks || undefined,
          checklists: [],
        }));

        await saveReportProcedures(createdReport.report_id, proceduresData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {report ? "Edit Daily Report" : "Create Daily Report"}
        </h2>
        <p className="text-gray-600 mt-1">
          {report
            ? "Update your report"
            : "Fill out your report for laboratory activities"}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Report Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Laboratory *
              </label>
              {assignedLab ? (
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">
                        {assignedLab.lab_name}
                      </span>
                      {assignedLab.location && (
                        <span className="text-gray-500 text-sm ml-2">
                          ({assignedLab.location})
                        </span>
                      )}
                      <span className="text-gray-400 text-xs ml-2">
                        (Your Assigned Lab)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={loadAssignedLab}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Refresh assignment"
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 bg-red-50 border border-red-300 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="text-red-700">
                      <span className="font-medium">
                        No laboratory assigned
                      </span>
                      <span className="text-sm ml-2">
                        Please contact an administrator to be assigned to a
                        laboratory before creating reports.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={loadAssignedLab}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Check again"
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Date *
              </label>
              <input
                type="date"
                value={formData.report_date}
                onChange={(e) =>
                  setFormData({ ...formData, report_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Procedures Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Procedures</h3>
            {procedures.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const allCompleted = procedures.every(
                    (proc) => proc.overall_status === "Completed",
                  );
                  const updatedProcedures = procedures.map((proc) => ({
                    ...proc,
                    overall_status: allCompleted ? "Pending" : "Completed",
                  }));
                  setProcedures(updatedProcedures);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {procedures.every((proc) => proc.overall_status === "Completed")
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>
          <div className="space-y-4">
            {/* Custom Procedure Dropdown */}
            <div className="relative" id="procedure-dropdown">
              <button
                type="button"
                onClick={() => {
                  setIsProcedureDropdownOpen(!isProcedureDropdownOpen);
                  setProcedureSearch(""); // Clear search when opening
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
              >
                <span className="text-gray-500">
                  {procedures.filter(
                    (proc) => proc.overall_status === "Completed",
                  ).length > 0
                    ? `${procedures.filter((proc) => proc.overall_status === "Completed").length} procedures selected`
                    : "Select procedures..."}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isProcedureDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      value={procedureSearch}
                      onChange={(e) => setProcedureSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Search procedures..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  {/* Scrollable List */}
                  <div className="max-h-40 overflow-y-auto">
                    {procedures
                      .filter((proc) => proc.overall_status !== "Completed")
                      .filter((proc) => 
                        proc.procedure_name.toLowerCase().includes(procedureSearch.toLowerCase())
                      )
                      .map((procedure) => (
                        <button
                          key={procedure.procedure_id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedProcedures = procedures.map((proc) =>
                              proc.procedure_id === procedure.procedure_id
                                ? { ...proc, overall_status: "Completed" }
                                : proc,
                            );
                            setProcedures(updatedProcedures);
                            setProcedureSearch(""); // Clear search after selection
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        >
                          {procedure.procedure_name}
                        </button>
                      ))}
                    {procedures
                      .filter((proc) => proc.overall_status !== "Completed")
                      .filter((proc) => 
                        proc.procedure_name.toLowerCase().includes(procedureSearch.toLowerCase())
                      ).length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        {procedureSearch ? "No procedures found" : "All procedures selected"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Procedures */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Selected Procedures:
              </h4>
              <div className="flex flex-wrap gap-2">
                {procedures
                  .filter((proc) => proc.overall_status === "Completed")
                  .map((procedure) => (
                    <div
                      key={procedure.procedure_id}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 rounded-full"
                    >
                      <span className="text-sm font-medium text-green-800">
                        {procedure.procedure_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedProcedures = procedures.map((proc) =>
                            proc.procedure_id === procedure.procedure_id
                              ? { ...proc, overall_status: "Pending" }
                              : proc,
                          );
                          setProcedures(updatedProcedures);
                        }}
                        className="text-green-600 hover:text-green-800 font-bold text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                {procedures.filter(
                  (proc) => proc.overall_status === "Completed",
                ).length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    No procedures selected
                  </p>
                )}
              </div>
            </div>
          </div>
          {procedures.length === 0 && (
            <p className="text-gray-500 text-sm">
              No procedures available for this laboratory
            </p>
          )}
        </div>

        {/* Workstations Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Workstations</h3>
            {workstations.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const allChecked = workstations.every((ws) => ws.checked);
                  const updatedWorkstations = workstations.map((ws) => ({
                    ...ws,
                    checked: !allChecked,
                  }));
                  setWorkstations(updatedWorkstations);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {workstations.every((ws) => ws.checked)
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>
          <div className="space-y-4">
            {/* Custom Workstation Dropdown */}
            <div className="relative" id="workstation-dropdown">
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setWorkstationSearch(""); // Clear search when opening
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
              >
                <span className="text-gray-500">
                  {workstations.filter((ws) => ws.checked).length > 0
                    ? `${workstations.filter((ws) => ws.checked).length} workstations selected`
                    : "Select workstations..."}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      value={workstationSearch}
                      onChange={(e) => setWorkstationSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Search workstations..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  {/* Scrollable List */}
                  <div className="max-h-40 overflow-y-auto">
                    {workstations
                      .filter((ws) => !ws.checked)
                      .filter((ws) => 
                        ws.workstation_name.toLowerCase().includes(workstationSearch.toLowerCase())
                      )
                      .map((workstation) => (
                        <button
                          key={workstation.workstation_id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedWorkstations = workstations.map((ws) =>
                              ws.workstation_id === workstation.workstation_id
                                ? { ...ws, checked: true }
                                : ws,
                            );
                            setWorkstations(updatedWorkstations);
                            setWorkstationSearch(""); // Clear search after selection
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        >
                          {workstation.workstation_name}
                        </button>
                      ))}
                    {workstations
                      .filter((ws) => !ws.checked)
                      .filter((ws) => 
                        ws.workstation_name.toLowerCase().includes(workstationSearch.toLowerCase())
                      ).length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        {workstationSearch ? "No workstations found" : "All workstations selected"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Workstations */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Selected Workstations:
              </h4>
              <div className="flex flex-wrap gap-2">
                {workstations
                  .filter((ws) => ws.checked)
                  .map((workstation) => (
                    <div
                      key={workstation.workstation_id}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-300 rounded-full"
                    >
                      <span className="text-sm font-medium text-blue-800">
                        {workstation.workstation_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedWorkstations = workstations.map((ws) =>
                            ws.workstation_id === workstation.workstation_id
                              ? { ...ws, checked: false }
                              : ws,
                          );
                          setWorkstations(updatedWorkstations);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                {workstations.filter((ws) => ws.checked).length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    No workstations selected
                  </p>
                )}
              </div>
            </div>
          </div>
          {workstations.length === 0 && (
            <p className="text-gray-500 text-sm">
              No workstations available for this laboratory
            </p>
          )}
        </div>

        {/* Remarks Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Remarks</h3>
          <div>
            <textarea
              value={formData.general_remarks}
              onChange={(e) =>
                setFormData({ ...formData, general_remarks: e.target.value })
              }
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your remarks..."
              required
            />
          </div>
        </div>

        {/* Note about auto-generated fields */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Report Information
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>This report will include:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>
                    <strong>Your assigned laboratory:</strong>{" "}
                    {assignedLab?.lab_name || "Not assigned"}
                  </li>
                  <li>
                    <strong>Your name:</strong> Automatically recorded as
                    custodian
                  </li>
                  <li>
                    <strong>Your email:</strong> Automatically recorded as added
                    by
                  </li>
                  <li>
                    <strong>Status:</strong> Initially set to "Pending" for
                    admin review
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !assignedLab}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : report ? "Update Report" : "Create Report"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyReportFormTab;
