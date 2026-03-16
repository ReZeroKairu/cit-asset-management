import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Search, Filter, Users, RefreshCw } from "lucide-react";
import { getCITLabUsersLogs } from "../api/forms";
import { getApiBaseUrl } from "../api/publicForms";
import { useAuth } from "../context/AuthContext";

interface CITLabUsersLog {
  log_id: number;
  usage_type: string;
  faculty_student_name: string;
  user_type: string;
  year_level: string | null;
  laboratory: string;
  printing_pages: string | null;
  ws_number: string | null;
  purpose: string;
  monitored_by: string | null;
  ip_address: string | null;
  created_at: string;
}

// Memoized table row component to prevent unnecessary re-renders
const LogTableRow = ({ log }: { log: CITLabUsersLog }) => {
  return (
    <tr key={log.log_id} className="border-b hover:bg-gray-50 transition-colors">
      <td className="py-4 px-4 font-medium">{log.faculty_student_name}</td>
      <td className="py-4 px-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          log.user_type === 'Student' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {log.user_type}
        </span>
      </td>
      <td className="py-4 px-4">{log.laboratory}</td>
      <td className="py-4 px-4">{log.usage_type}</td>
      <td className="py-4 px-4 max-w-lg" title={log.purpose}>
        <div className="text-sm leading-relaxed break-words">{log.purpose}</div>
      </td>
      <td className="py-4 px-4">{log.monitored_by || '-'}</td>
      <td className="py-4 px-4 text-gray-500 text-sm">
        {new Date(log.created_at).toLocaleString()}
      </td>
    </tr>
  );
};

LogTableRow.displayName = 'LogTableRow';

const ArchiveCITLabUsersPage = () => {
  const [logs, setLogs] = useState<CITLabUsersLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<CITLabUsersLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    laboratory: "all",
    user_type: "all",
    search: ""
  });
  const [uniqueLabs, setUniqueLabs] = useState<string[]>([]);
  const hasFetched = useRef(false);
  const lastRequestTime = useRef(0);
  const requestTimeout = useRef<NodeJS.Timeout | null>(null);

  const { user, refreshUser } = useAuth();

  console.log('🔍 Current user object:', user);
  console.log('🔍 User role:', user?.role);
  console.log('🔍 User lab_id:', user?.lab_id);
  console.log('🔍 User lab_name:', user?.lab_name);

  // Refresh user data on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const fetchLabs = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/laboratories/public`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const labNames = data.map((lab: any) => lab.lab_name).filter(Boolean);
        console.log('🔬 All available labs from API:', labNames);
        setUniqueLabs(labNames);
      }
    } catch (error) {
      console.error('❌ Error fetching labs:', error);
      // Fallback to common lab names
      const fallbackLabs = [
        "E-Forum",
        "Hardware Lab", 
        "Software Lab",
        "Network Lab",
        "Computer Laboratory 1",
        "Computer Laboratory 2"
      ];
      setUniqueLabs(fallbackLabs);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchLogs();
      fetchLabs();
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const fetchLogs = async (retryCount = 0) => {
    try {
      // Prevent multiple rapid requests within 1 second
      const now = Date.now();
      if (now - lastRequestTime.current < 1000) {
        console.log('⏳ Throttling request to prevent 429 errors');
        return;
      }
      lastRequestTime.current = now;

      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching CIT Lab Users logs...');
      
      const response = await getCITLabUsersLogs();
      const logsData = response?.data || [];
      setLogs(logsData);
      
      console.log('✅ Successfully fetched CIT Lab Users logs:', logsData.length, 'records');
    } catch (err: any) {
      console.error('❌ Error fetching CIT Lab Users logs:', err);
      
      // Handle 429 rate limit error specifically
      if (err.response?.status === 429) {
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`🔄 429 error, retrying in ${delay/1000}s... (attempt ${retryCount + 1}/3)`);
          setError(`Rate limited. Retrying in ${delay/1000} seconds...`);
          
          requestTimeout.current = setTimeout(() => {
            fetchLogs(retryCount + 1);
          }, delay);
        } else {
          setError('Too many requests. Please wait a moment and try again manually.');
        }
      } else if (err.response?.status === 404) {
        setError('CIT Lab Users service not found. Please check if the backend is running.');
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please check if the backend is running on port 3001.');
      } else {
        setError(err.message || "Failed to fetch CIT Lab Users logs");
      }
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (requestTimeout.current) {
        clearTimeout(requestTimeout.current);
      }
    };
  }, []);

  const applyFilters = useCallback(() => {
    // Use setTimeout to defer heavy filtering to next tick
    setTimeout(() => {
      console.log('🔍 Applying filters:', filters);
      console.log('📊 Total logs before filtering:', logs.length);
      
      let filtered = logs;

      // For custodians: automatically filter to only their assigned lab
      if (user?.role === 'Custodian' && user?.lab_id) {
        filtered = filtered.filter(log => log.laboratory === user.lab_name);
        console.log(`👮 Custodian filter: Only showing logs for ${user.lab_name} (ID: ${user.lab_id})`);
      } else {
        // Laboratory filter (skip if "all") - for admins
        if (filters.laboratory && filters.laboratory !== "all") {
          filtered = filtered.filter(log => log.laboratory === filters.laboratory);
          console.log(`🔬 Lab filter "${filters.laboratory}": ${filtered.length} results`);
        }
      }

      // User type filter (skip if "all")
      if (filters.user_type && filters.user_type !== "all") {
        filtered = filtered.filter(log => log.user_type === filters.user_type);
        console.log(`👤 User type filter "${filters.user_type}": ${filtered.length} results`);
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(log =>
          log.faculty_student_name.toLowerCase().includes(searchLower) ||
          (log.laboratory && log.laboratory.toLowerCase().includes(searchLower)) ||
          (log.purpose && log.purpose.toLowerCase().includes(searchLower)) ||
          (log.usage_type && log.usage_type.toLowerCase().includes(searchLower)) ||
          (log.monitored_by && log.monitored_by.toLowerCase().includes(searchLower))
        );
        console.log(`🔍 Search filter "${filters.search}": ${filtered.length} results`);
      }

      console.log('✅ Final filtered results:', filtered.length);
      setFilteredLogs(filtered);
    }, 0); // Defer to next tick
  }, [logs, filters, user]);

  const handleFilterChange = (field: string, value: string) => {
    console.log(`🔄 Filter change: ${field} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    console.log('🧹 Clearing all filters');
    setFilters({
      laboratory: "all",
      user_type: "all",
      search: ""
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading CIT Lab Users logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <div className="flex justify-center gap-2">
          <Button onClick={() => fetchLogs(0)} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
          <Button 
            onClick={() => {
              hasFetched.current = false;
              setTimeout(() => fetchLogs(0), 1000);
            }} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry in 1 second
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">CIT Lab Users Logs</h2>
          <span className="text-sm text-gray-500">({filteredLogs.length} records)</span>
          <Button 
            onClick={() => {
              hasFetched.current = false;
              fetchLogs(0);
            }} 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold">Filters</h3>
            <Button onClick={clearFilters} variant="ghost" size="sm">
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="laboratory">Laboratory</Label>
              {user?.role === 'Custodian' ? (
                <Select value={user.lab_name || 'no-lab-assigned'} disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="No lab assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={user.lab_name || 'no-lab-assigned'}>
                      {user.lab_name || 'No lab assigned'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={filters.laboratory} onValueChange={(value) => handleFilterChange("laboratory", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Labs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labs</SelectItem>
                    {uniqueLabs.map((lab) => (
                      <SelectItem key={lab} value={lab}>
                        {lab}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user_type">User Type</Label>
              <Select value={filters.user_type} onValueChange={(value) => handleFilterChange("user_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search name, lab, purpose..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-6">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No CIT Lab Users logs found</p>
              <p className="text-sm">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-700">Name</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-700">User Type</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-700">Laboratory</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-700">Usage Type</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-700">Purpose</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-700">Monitored By</th>
                    <th className="py-3 px-4 text-left font-semibold text-sm text-gray-700">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <LogTableRow key={log.log_id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArchiveCITLabUsersPage;
