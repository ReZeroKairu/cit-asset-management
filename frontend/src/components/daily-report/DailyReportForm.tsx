import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserAssignedLab, createDailyReport, updateDailyReport } from "../../api/dailyReports";
import api from "../../api/axios";
import type {
  DailyReport
} from '../../api/dailyReports';

interface DailyReportFormProps {
  report?: DailyReport;
  onSuccess: () => void;
  onCancel: () => void;
}

const DailyReportForm: React.FC<DailyReportFormProps> = ({ report, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    lab_id: report?.lab_id || 0,
    report_date: report?.report_date || new Date().toISOString().split('T')[0],
    general_remarks: report?.general_remarks || ''
  });

  const [assignedLab, setAssignedLab] = useState<any>(null);
  const [standardTasks, setStandardTasks] = useState<any[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssignedLab();
    loadStandardTasks();
    if (report) {
      loadReportTasks(report.report_id);
    }
  }, []);

  const loadStandardTasks = async () => {
    try {
      const response = await api.get('/standard-tasks');
      setStandardTasks(response.data);
    } catch (err: any) {
      console.error('Failed to load standard tasks:', err);
    }
  };

  const loadReportTasks = async (reportId: number) => {
    try {
      const response = await api.get(`/daily-reports/${reportId}/tasks`);
      setSelectedTasks(response.data.map((task: any) => task.task_id));
    } catch (err: any) {
      console.error('Failed to load report tasks:', err);
    }
  };

  const loadAssignedLab = async () => {
    try {
      const data = await getUserAssignedLab();
      setAssignedLab(data.assigned_lab);
      
      // Auto-fill lab_id if user has assigned lab
      if (data.assigned_lab && !report) {
        setFormData(prev => ({
          ...prev,
          lab_id: data.assigned_lab.lab_id
        }));
      }
    } catch (err: any) {
      setError('Failed to load assigned laboratory');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData
      };

      if (report) {
        await updateDailyReport(report.report_id, submitData);
      } else {
        await createDailyReport(submitData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {report ? 'Edit Daily Report' : 'Create Daily Report'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Report Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Laboratory
                </label>
                <div className="px-3 py-2 bg-white border border-gray-300 rounded-md">
                  {assignedLab ? (
                    <div>
                      <span className="font-medium text-gray-900">{assignedLab.lab_name}</span>
                      {assignedLab.location && (
                        <span className="text-gray-500 text-sm ml-2">({assignedLab.location})</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">No laboratory assigned</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Date *
                </label>
                <input
                  type="date"
                  value={formData.report_date}
                  onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Tasks</h3>
            <div className="space-y-2">
              {standardTasks.map((task) => (
                <label key={task.task_id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.task_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks([...selectedTasks, task.task_id]);
                      } else {
                        setSelectedTasks(selectedTasks.filter(id => id !== task.task_id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{task.task_name}</span>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">{task.category}</span>
                  </div>
                </label>
              ))}
              {standardTasks.length === 0 && (
                <p className="text-gray-500 text-sm">No standard tasks available</p>
              )}
            </div>
          </div>

          {/* Remarks Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Remarks</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What did you accomplish today? *
              </label>
              <textarea
                value={formData.general_remarks}
                onChange={(e) => setFormData({ ...formData, general_remarks: e.target.value })}
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
                <h3 className="text-sm font-medium text-blue-800">Report Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>This report will include:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><strong>Your assigned laboratory:</strong> {assignedLab?.lab_name || 'Not assigned'}</li>
                    <li><strong>Your name:</strong> Automatically recorded as custodian</li>
                    <li><strong>Your email:</strong> Automatically recorded as added by</li>
                    <li><strong>Status:</strong> Initially set to "Pending" for admin review</li>
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (report ? 'Update Report' : 'Create Report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyReportForm;
