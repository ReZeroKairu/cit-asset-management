//frontent/src/components/daily-report/DailyReportForm.tsx
import React, { useState, useEffect } from "react";
import {
  getUserAssignedLab,
  createDailyReport,
  updateDailyReport,
} from "../../api/dailyReports";
import api from "../../api/axios";
import type { DailyReport } from "../../api/dailyReports";

interface DailyReportFormProps {
  report?: DailyReport;
  onSuccess: () => void;
  onCancel: () => void;
}

const DailyReportForm: React.FC<DailyReportFormProps> = ({
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
  const [standardTasks, setStandardTasks] = useState<any[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [workstations, setWorkstations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAssignedLab();
    loadStandardTasks();
    if (report) {
      loadReportTasks(report.report_id);
    }
  }, []);

  useEffect(() => {
    if (formData.lab_id) {
      loadWorkstations(formData.lab_id);
    }
  }, [formData.lab_id, report]);

  const loadStandardTasks = async () => {
    try {
      const response = await api.get("/standard-tasks");
      setStandardTasks(response.data);
    } catch (err: any) {
      console.error("Failed to load standard tasks:", err);
    }
  };

  const loadReportTasks = async (reportId: number) => {
    try {
      const response = await api.get(`/daily-reports/${reportId}/tasks`);
      setSelectedTasks(response.data.map((task: any) => task.task_id));
    } catch (err: any) {
      console.error("Failed to load report tasks:", err);
    }
  };

  const loadWorkstations = async (labId: number) => {
    try {
      const response = await api.get("/lab-workstations", {
        params: {
          lab_id: labId,
          ...(report ? { reportId: report.report_id } : {}),
        },
      });
      setWorkstations(response.data);
    } catch (err: any) {
      console.error("Failed to load workstations:", err);
    }
  };

  const loadAssignedLab = async () => {
    try {
      console.log("Loading assigned lab...");
      const data = await getUserAssignedLab();
      console.log("API Response:", data);
      setAssignedLab(data.assigned_lab);

      // Auto-fill lab_id if user has assigned lab (for both new and existing reports)
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

    // Prevent submission if no assigned lab
    if (!assignedLab) {
      setError("You must be assigned to a laboratory to create reports");
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        checklist_items: selectedTasks.map((taskId) => ({
          task_id: taskId,
          task_status: "Done" as const,
        })),
      };

      let createdReport;
      if (report) {
        await updateDailyReport(report.report_id, submitData);
        createdReport = { report_id: report.report_id };
      } else {
        createdReport = await createDailyReport(submitData);
      }

      // Save workstation data if any workstations are checked
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

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {report ? "Edit Daily Report" : "Create Daily Report"}
        </h2>

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

          {/* Tasks Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Daily Tasks
            </h3>
            <div className="space-y-2">
              {standardTasks.map((task) => (
                <label
                  key={task.task_id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.task_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks([...selectedTasks, task.task_id]);
                      } else {
                        setSelectedTasks(
                          selectedTasks.filter((id) => id !== task.task_id),
                        );
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {task.task_name}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      {task.category}
                    </span>
                  </div>
                </label>
              ))}
              {standardTasks.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No standard tasks available
                </p>
              )}
            </div>
          </div>

          {/* Workstations Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Workstation Status
            </h3>
            <div className="space-y-3">
              {workstations.map((workstation) => (
                <div
                  key={workstation.workstation_id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={workstation.checked || false}
                        onChange={(e) => {
                          const updatedWorkstations = workstations.map((ws) =>
                            ws.workstation_id === workstation.workstation_id
                              ? { ...ws, checked: e.target.checked }
                              : ws,
                          );
                          setWorkstations(updatedWorkstations);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="font-medium text-gray-900">
                        {workstation.workstation_name}
                      </span>
                    </div>
                    {workstation.checked && (
                      <select
                        value={workstation.status || "Working"}
                        onChange={(e) => {
                          const updatedWorkstations = workstations.map((ws) =>
                            ws.workstation_id === workstation.workstation_id
                              ? { ...ws, status: e.target.value }
                              : ws,
                          );
                          setWorkstations(updatedWorkstations);
                        }}
                        className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Working">Working</option>
                        <option value="Not Working">Not Working</option>
                        <option value="Needs Maintenance">
                          Needs Maintenance
                        </option>
                      </select>
                    )}
                  </div>
                  {workstation.checked && (
                    <input
                      type="text"
                      placeholder="Add remarks (optional)"
                      value={workstation.remarks || ""}
                      onChange={(e) => {
                        const updatedWorkstations = workstations.map((ws) =>
                          ws.workstation_id === workstation.workstation_id
                            ? { ...ws, remarks: e.target.value }
                            : ws,
                        );
                        setWorkstations(updatedWorkstations);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
              {workstations.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No workstations available for this laboratory
                </p>
              )}
            </div>
          </div>

          {/* Remarks Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Daily Remarks
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What did you accomplish today? *
              </label>
              <textarea
                value={formData.general_remarks}
                onChange={(e) =>
                  setFormData({ ...formData, general_remarks: e.target.value })
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your daily accomplishments, tasks completed, issues encountered, or any important activities..."
                required
              />
            </div>
          </div>

          {/* Note about auto-generated fields */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="bi bi-info-circle text-blue-400"></i>
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
                      <strong>Your email:</strong> Automatically recorded as
                      added by
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
              className="px-6 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : report
                  ? "Update Report"
                  : "Create Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyReportForm;
