import { useState, useEffect } from "react";
import {
  Activity,
  Calendar,
  Building2,
  User,
  Search,
  FileText,
  Eye,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import api from "../api/axios";

interface Activity {
  id: number;
  title: string;
  custodian_name: string;
  lab_name: string;
  timestamp: string;
  category?: string;
  status?: string;
}

interface DailyReport {
  report_id: number;
  full_name: string;
  lab_name: string;
  report_date: string;
  created_at: string;
  general_remarks: string;
  workstation_count?: number;
  procedure_count?: number;
}

interface FilterOptions {
  laboratory: string;
  custodian: string;
  dateRange: "today" | "week" | "custom";
  startDate: string;
  endDate: string;
  search: string;
}

const DailyAccomplishmentsPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [laboratories, setLaboratories] = useState<any[]>([]);
  const [custodians, setCustodians] = useState<any[]>([]);

  const [selectedLab, setSelectedLab] = useState<string>("");

  const [filters, setFilters] = useState<FilterOptions>({
    laboratory: "",
    custodian: "",
    dateRange: "week",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("report_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Modal state for View Details
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch laboratories on component mount
  useEffect(() => {
    const fetchLaboratories = async () => {
      try {
        const response = await api.get("/laboratories");
        const data = response.data;
        setLaboratories(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error("Error fetching laboratories:", error);
      }
    };

    fetchLaboratories();
  }, []);

  // Fetch activities and custodians
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch activities from audit logs
        const auditResponse = await api.get("/audit-logs?limit=100");
        const auditData = auditResponse.data;

        // Transform audit logs to activities
        const transformedActivities: Activity[] = (auditData.logs || []).map(
          (log: any) => ({
            id: log.id,
            title: log.description || log.action,
            custodian_name: log.user_name || "Unknown",
            lab_name: log.user_lab_name || "N/A",
            timestamp: log.created_at,
            category: log.action_category,
            status: log.status,
          }),
        );

        setActivities(transformedActivities);

        // Fetch daily reports
        try {
          const reportsResponse = await api.get("/daily-reports");
          const reportsData = reportsResponse.data;

          const transformedReports: DailyReport[] = (
            reportsData.data ||
            reportsData ||
            []
          ).map((report: any) => ({
            report_id: report.report_id,
            full_name:
              report.users?.full_name || report.custodian_name || "Unknown",
            lab_name: report.laboratories?.lab_name || report.lab_name || "N/A",
            report_date: report.report_date,
            created_at: report.created_at,
            general_remarks: report.general_remarks || "",
            workstation_count: report.workstation_items?.length || 0,
            procedure_count: report.procedures?.length || 0,
          }));
          setDailyReports(transformedReports);
        } catch (reportsError) {
          console.error("Error fetching daily reports:", reportsError);
        }

        // Extract unique custodians from activities
        const uniqueCustodians = Array.from(
          new Set(transformedActivities.map((a) => a.custodian_name)),
        );
        setCustodians(
          uniqueCustodians.map((name) => ({
            id: name,
            name: name,
          })),
        );
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...activities];

    // Filter by laboratory
    if (filters.laboratory) {
      filtered = filtered.filter((a) => a.lab_name === filters.laboratory);
    }

    // Filter by custodian
    if (filters.custodian) {
      filtered = filtered.filter((a) => a.custodian_name === filters.custodian);
    }

    // Filter by search text
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.custodian_name.toLowerCase().includes(searchLower) ||
          a.lab_name.toLowerCase().includes(searchLower),
      );
    }

    // Filter by date range
    if (filters.dateRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter((a) => {
        const actDate = new Date(a.timestamp);
        actDate.setHours(0, 0, 0, 0);
        return actDate.getTime() === today.getTime();
      });
    } else if (filters.dateRange === "week") {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((a) => {
        const actDate = new Date(a.timestamp);
        return actDate >= weekAgo && actDate <= today;
      });
    } else if (
      filters.dateRange === "custom" &&
      filters.startDate &&
      filters.endDate
    ) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((a) => {
        const actDate = new Date(a.timestamp);
        return actDate >= start && actDate <= end;
      });
    }

    // Sort by timestamp descending
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    setFilteredActivities(filtered);
  }, [activities, filters]);

  // Apply filters to daily reports
  useEffect(() => {
    let filtered = [...dailyReports];

    // Filter by laboratory
    if (filters.laboratory) {
      filtered = filtered.filter((r) => r.lab_name === filters.laboratory);
    }

    // Filter by custodian
    if (filters.custodian) {
      filtered = filtered.filter((r) => r.full_name === filters.custodian);
    }

    // Filter by search text
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.general_remarks.toLowerCase().includes(searchLower) ||
          r.full_name.toLowerCase().includes(searchLower) ||
          r.lab_name.toLowerCase().includes(searchLower),
      );
    }

    // Filter by date range
    if (filters.dateRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter((r) => {
        const reportDate = new Date(r.report_date);
        reportDate.setHours(0, 0, 0, 0);
        return reportDate.getTime() === today.getTime();
      });
    } else if (filters.dateRange === "week") {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => {
        const reportDate = new Date(r.report_date);
        return reportDate >= weekAgo && reportDate <= today;
      });
    } else if (
      filters.dateRange === "custom" &&
      filters.startDate &&
      filters.endDate
    ) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => {
        const reportDate = new Date(r.report_date);
        return reportDate >= start && reportDate <= end;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case "report_id":
          aVal = a.report_id;
          bVal = b.report_id;
          break;
        case "full_name":
          aVal = a.full_name.toLowerCase();
          bVal = b.full_name.toLowerCase();
          break;
        case "lab_name":
          aVal = a.lab_name.toLowerCase();
          bVal = b.lab_name.toLowerCase();
          break;
        case "report_date":
          aVal = new Date(a.report_date).getTime();
          bVal = new Date(b.report_date).getTime();
          break;
        case "created_at":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case "workstation_count":
          aVal = a.workstation_count || 0;
          bVal = b.workstation_count || 0;
          break;
        case "procedure_count":
          aVal = a.procedure_count || 0;
          bVal = b.procedure_count || 0;
          break;
        default:
          aVal = new Date(a.report_date).getTime();
          bVal = new Date(b.report_date).getTime();
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    setFilteredReports(filtered);
  }, [dailyReports, filters, sortColumn, sortDirection]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    if (key === "laboratory") {
      setSelectedLab(value);
    }
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setSelectedLab("");
    setFilters({
      laboratory: "",
      custodian: "",
      dateRange: "week",
      startDate: "",
      endDate: "",
      search: "",
    });
  };

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // View Details handler
  const handleViewDetails = (report: DailyReport) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className=" bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Custodian Daily Accomplishments
        </h1>
        <p className="text-gray-600">
          Track and monitor daily activities and task submissions across all
          laboratories
        </p>
      </div>

      {/* Laboratory Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setSelectedLab("");
              handleFilterChange("laboratory", "");
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              selectedLab === ""
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Laboratories
          </button>
          {laboratories.map((lab) => (
            <button
              key={lab.id || lab.laboratory_id}
              onClick={() => {
                const labName = lab.laboratory_name || lab.name;
                setSelectedLab(labName);
                handleFilterChange("laboratory", labName);
              }}
              className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                selectedLab === (lab.laboratory_name || lab.name)
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {lab.laboratory_name || lab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Search activities..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Custodian Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custodian
            </label>
            <select
              value={filters.custodian}
              onChange={(e) => handleFilterChange("custodian", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Custodians</option>
              {custodians.map((custodian) => (
                <option key={custodian.id} value={custodian.name}>
                  {custodian.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) =>
                handleFilterChange("dateRange", e.target.value as any)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Activities Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredActivities.length} result(s)
            </p>
          </div>
          <Activity className="w-6 h-6 text-blue-600" />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 mt-4">Loading accomplishments...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No accomplishments found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Custodian
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Laboratory
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date & Time
                    </div>
                  </th>
                  {activities.some((a) => a.category) && (
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {activity.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {activity.custodian_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {activity.lab_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(activity.timestamp)}
                    </td>
                    {activities.some((a) => a.category) && (
                      <td className="px-6 py-4 text-sm">
                        {activity.category ? (
                          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                            {activity.category}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Daily Reports Section */}
      <div className="bg-white rounded-lg shadow mt-8">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Daily Reports Submitted
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredReports.length} report(s)
            </p>
          </div>
          <FileText className="w-6 h-6 text-emerald-600" />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 mt-4">Loading daily reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No daily reports found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    onClick={() => handleSort("report_id")}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Report ID
                      {sortColumn === "report_id" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("full_name")}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Custodian
                      {sortColumn === "full_name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("lab_name")}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Laboratory
                      {sortColumn === "lab_name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("report_date")}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Report Date
                      {sortColumn === "report_date" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("workstation_count")}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Workstations
                      {sortColumn === "workstation_count" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("procedure_count")}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Procedures
                      {sortColumn === "procedure_count" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Remarks
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr
                    key={report.report_id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      #{report.report_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {report.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {report.lab_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(report.report_date).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                        {report.workstation_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                        {report.procedure_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div
                        className="max-w-xs truncate"
                        title={report.general_remarks}
                      >
                        {report.general_remarks || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleViewDetails(report)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                Report Details #{selectedReport.report_id}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Report Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Report ID
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">
                    #{selectedReport.report_id}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Status
                  </h3>
                  <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                    Submitted
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Custodian
                  </h3>
                  <p className="text-lg text-gray-900">
                    {selectedReport.full_name}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Laboratory
                  </h3>
                  <p className="text-lg text-gray-900">
                    {selectedReport.lab_name}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Report Date
                  </h3>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedReport.report_date).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Submitted On
                  </h3>
                  <p className="text-lg text-gray-900">
                    {formatDate(selectedReport.created_at)}
                  </p>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {selectedReport.workstation_count || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Workstations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {selectedReport.procedure_count || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Procedures</p>
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  General Remarks
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedReport.general_remarks || "No remarks provided"}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyAccomplishmentsPage;
