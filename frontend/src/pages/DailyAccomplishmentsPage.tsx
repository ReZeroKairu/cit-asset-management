import { useState, useEffect } from "react";
import { Activity, Calendar, Building2, User, Search } from "lucide-react";

interface Activity {
  id: number;
  title: string;
  custodian_name: string;
  lab_name: string;
  timestamp: string;
  category?: string;
  status?: string;
}

interface FilterOptions {
  laboratory: string;
  custodian: string;
  dateRange: "today" | "week" | "custom";
  startDate: string;
  endDate: string;
  search: string;
}

const LabAccomplishmentsPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
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

  // Fetch laboratories on component mount
  useEffect(() => {
    const fetchLaboratories = async () => {
      try {
        const response = await fetch("/api/laboratories");
        const data = await response.json();
        setLaboratories(data || []);
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
        // Fetch activities from audit logs or daily reports
        const response = await fetch("/api/audit-logs?limit=100");
        const data = await response.json();

        // Transform audit logs to activities
        const transformedActivities: Activity[] = (data.logs || []).map(
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
    </div>
  );
};

export default LabAccomplishmentsPage;
