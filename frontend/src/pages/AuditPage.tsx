import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Shield, Filter, RefreshCw } from 'lucide-react';
import api from '../api/axios';

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  description: string;
  created_at: string;
  user_name: string;
  user_email: string;
  user_role: string;
  user_type: string;
  log_date: string;
  log_time: string;
  formatted_timestamp: string;
  formatted_date: string;
  formatted_time: string;
  user_lab_name: string;
  user_lab_location: string;
  action_category: string;
  priority_level: string;
  searchable_text: string;
  ip_address_display: string;
}

const AuditPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });
  const [total, setTotal] = useState(0);

  const handleClearFilters = () => {
    setFilters({
      action: '',
      search: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    });
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());

      const response = await api.get(`/audit?${queryParams}`);
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'text-green-600 bg-green-100';
      case 'CREATE': return 'text-blue-600 bg-blue-100';
      case 'UPDATE': return 'text-yellow-600 bg-yellow-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Audit Logs</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleClearFilters} variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search action, description, user email, name, or role..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Action</label>
              <Input
                placeholder="Filter by action (LOGIN, CREATE, etc.)"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            System Activity ({total} total logs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs found matching your criteria
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="flex items-center justify-between p-2 border-b bg-gray-50 text-xs font-medium text-gray-700 rounded-t">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="w-12 text-center">Action</div>
                  <div className="flex-1">Details</div>
                </div>
                <div className="text-right">
                  <div>IP Address</div>
                  <div>Date & Time</div>
                </div>
              </div>
              
              {/* Table Rows */}
              <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 border rounded text-sm hover:bg-gray-50">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)} flex-shrink-0`}>
                      {log.action}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs truncate">{log.description}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {log.user_name === 'System' ? 'System' : `${log.user_name} (${log.user_email})`}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0 text-right">
                    <div className="font-mono text-xs">{log.ip_address_display}</div>
                    <div className="text-xs">{formatDate(log.created_at)}</div>
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, total)} of {total} logs
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
              disabled={filters.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page * filters.limit >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
