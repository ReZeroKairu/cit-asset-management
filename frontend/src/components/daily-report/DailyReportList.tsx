import React, { useState, useEffect } from "react";
import { getAllDailyReports, getMyDailyReports, updateDailyReport } from "../../api/dailyReports";
import type { DailyReport } from '../../api/dailyReports';
import DailyReportForm from './DailyReportForm';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface DailyReportListProps {
  viewMode?: 'my' | 'all';
  adminMode?: boolean;
}

const DailyReportList: React.FC<DailyReportListProps> = ({ viewMode = 'my', adminMode = false }) => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | undefined>();
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    loadReports();
  }, [viewMode, filters]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (activeDropdown !== null) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      const data = viewMode === 'my' 
        ? await getMyDailyReports({
            status: filters.status || undefined,
            start_date: filters.start_date || undefined,
            end_date: filters.end_date || undefined
          })
        : await getAllDailyReports({
            status: adminMode ? (filters.status || 'Pending') : (filters.status || undefined),
            start_date: filters.start_date || undefined,
            end_date: filters.end_date || undefined
          });
      setReports(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingReport(undefined);
    setShowForm(true);
  };

  const handleEdit = (report: DailyReport) => {
    setEditingReport(report);
    setShowForm(true);
  };

  const handleStatusUpdate = async (reportId: number, newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    try {
      await updateDailyReport(reportId, { status: newStatus as 'Pending' | 'Approved' });
      loadReports();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update report status');
    }
  };


  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingReport(undefined);
    loadReports();
  };

  const handleView = (report: any) => {
    // For now, we'll just show an alert with the report details
    // Later we can create a proper modal view
    alert(`Report Details:\n\nID: ${report.report_id}\nDate: ${report.report_date}\nLaboratory: ${report.laboratory?.lab_name || 'N/A'}\nCustodian: ${report.user?.full_name || 'N/A'}\nStatus: ${report.status}\nRemarks: ${report.general_remarks || 'N/A'}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return { backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };
      case 'Pending': return { backgroundColor: '#eab308', color: 'white', fontWeight: 'bold', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };
      default: return { backgroundColor: '#6b7280', color: 'white', fontWeight: 'bold', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === 'my' ? 'My Daily Reports' : 'All Daily Reports'}
          </h2>
          {adminMode && (
            <p className="text-sm text-gray-500 mt-1">
              📋 Default view shows pending reports. Use status filter to see approved reports.
            </p>
          )}
        </div>
        {!adminMode && (
          <Button onClick={handleCreate}>
            Create New Report
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={adminMode ? (filters.status || 'Pending') : filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {adminMode ? (
                  <>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                  </>
                ) : (
                  <>
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ status: '', start_date: '', end_date: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No daily reports found</p>
          {adminMode ? (
            <p className="text-gray-400 mt-2">No reports have been created by custodians yet.</p>
          ) : (
            <p className="text-gray-400 mt-2">Create your first report to get started</p>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={adminMode ? 4 : 3} className="text-center py-4">
                        {adminMode ? (
                          <p className="text-gray-400 mt-2">No reports have been created by custodians yet.</p>
                        ) : (
                          <p className="text-gray-400 mt-2">Create your first report to get started</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    reports.map((report: any) => (
                      <tr key={report.report_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.report_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(report.report_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs truncate" title={report.general_remarks || ''}>
                            {report.general_remarks || 'No remarks'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span style={getStatusColor(report.status)}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-32">
                          <div className="flex items-center justify-end">
                            {!adminMode && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(report)}
                              >
                                Edit
                              </Button>
                            )}
                            
                            {user?.role === 'Admin' && (
                              <div className="relative">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(activeDropdown === report.report_id ? null : report.report_id);
                                  }}
                                >
                                  ⚙️ Actions
                                </Button>
                                
                                {activeDropdown === report.report_id && (
                                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                                    <div className="py-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleView(report);
                                          setActiveDropdown(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                      >
                                        👁️ View Details
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusUpdate(report.report_id, 'Approved');
                                          setActiveDropdown(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                      >
                                        ✅ Approve
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusUpdate(report.report_id, 'Pending');
                                          setActiveDropdown(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                                      >
                                        ⏰ Set to Pending
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <DailyReportForm 
              report={editingReport} 
              onSuccess={handleFormSuccess} 
              onCancel={() => {
                setShowForm(false);
                setEditingReport(undefined);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReportList;
