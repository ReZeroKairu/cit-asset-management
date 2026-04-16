import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  getInventoryAnalytics,
  type InventoryAnalyticsData,
} from "../../api/inventoryAnalytics";
import {
  getComplaintsAnalytics,
  type ComplaintsAnalyticsData,
} from "../../api/complaints";
import {
  getMaintenanceAnalytics,
  type MaintenanceAnalyticsData,
} from "../../api/maintenance";

const COLORS = {
  Functional: "#10b981",
  "For Replacement": "#f59e0b",
  "For Disposal": "#ef4444",
  "For Upgrade": "#8b5cf6",
};

const InventoryAnalyticsSection = () => {
  const [data, setData] = useState<InventoryAnalyticsData | null>(null);
  const [complaintsData, setComplaintsData] =
    useState<ComplaintsAnalyticsData | null>(null);
  const [maintenanceData, setMaintenanceData] =
    useState<MaintenanceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date filter states for complaints analytics
  const currentYear = new Date().getFullYear();
  const [complaintsStartDate, setComplaintsStartDate] = useState(`${currentYear}-01-01`);
  const [complaintsEndDate, setComplaintsEndDate] = useState(`${currentYear}-12-31`);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch inventory analytics
        const analyticsData = await getInventoryAnalytics();
        setData(analyticsData);

        // Fetch maintenance analytics
        const maintenanceAnalyticsData = await getMaintenanceAnalytics();
        setMaintenanceData(maintenanceAnalyticsData);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchComplaintsAnalytics = async () => {
      try {
        // Fetch complaints analytics with date filters
        const complaintsAnalyticsData = await getComplaintsAnalytics(
          complaintsStartDate || undefined,
          complaintsEndDate || undefined
        );
        setComplaintsData(complaintsAnalyticsData);
      } catch (err) {
        console.error("Failed to fetch complaints analytics:", err);
      }
    };

    fetchComplaintsAnalytics();
  }, [complaintsStartDate, complaintsEndDate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Status Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error || "No data available"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          System Status Analytics
        </h2>
        <p className="text-gray-600">Monitor system status distribution</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Asset Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        COLORS[entry.status_name as keyof typeof COLORS] ||
                        "#8884d8"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const entry = payload[0].payload;
                      const total = data.statusDistribution.reduce((sum: number, item: any) => sum + item.count, 0);
                      const percentage = ((entry.count / total) * 100).toFixed(1);
                      return (
                        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                          <p className="font-medium">{entry.status_name}</p>
                          <p className="text-sm">Count: {entry.count}</p>
                          <p className="text-sm">Percentage: {percentage}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {data.statusDistribution.map((status) => (
                <div
                  key={status.status_name}
                  className="flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        COLORS[status.status_name as keyof typeof COLORS] ||
                        "#8884d8",
                    }}
                  />
                  <span className="text-sm text-gray-600">
                    {status.status_name} ({status.count})
                  </span>
                </div>
              ))}
            </div>

            {/* System Status Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                System Status Summary
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Assets:</span>
                  <span className="font-medium">
                    {data.summary.totalAssets}
                  </span>
                </div>
                {[
                  "Functional",
                  "For Replacement",
                  "For Disposal",
                  "For Upgrade",
                ].map((statusName) => {
                  const status = data.statusDistribution.find(
                    (s) => s.status_name === statusName
                  );
                  const count = status ? status.count : 0;
                  return (
                    <div key={statusName} className="flex justify-between">
                      <span
                        className={
                          statusName === "Functional"
                            ? "text-green-600"
                            : statusName === "For Replacement"
                            ? "text-yellow-600"
                            : statusName === "For Disposal"
                            ? "text-red-600"
                            : statusName === "For Upgrade"
                            ? "text-purple-600"
                            : "text-gray-600"
                        }
                      >
                        {statusName === "For Replacement"
                          ? "Replace"
                          : statusName === "For Disposal"
                          ? "Disposal"
                          : statusName === "For Upgrade"
                          ? "Upgrade"
                          : statusName}
                        :
                      </span>
                      <span
                        className={`font-medium ${
                          statusName === "Functional"
                            ? "text-green-600"
                            : statusName === "For Replacement"
                            ? "text-yellow-600"
                            : statusName === "For Disposal"
                            ? "text-red-600"
                            : statusName === "For Upgrade"
                            ? "text-purple-600"
                            : "text-gray-600"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Laboratory Status Breakdown */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Laboratory Status Breakdown
              </h4>
              <div className="space-y-3">
                {data.labStatusData.map((lab) => (
                  <div
                    key={lab.lab_id}
                    className="border border-gray-100 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-medium text-gray-900">
                        {lab.lab_name}
                      </h5>
                      <span className="text-xs text-gray-500">
                        {lab.total} assets
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-green-600">
                          {lab.Functional || 0}
                        </div>
                        <div className="text-gray-500">Functional</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-yellow-600">
                          {lab["For Replacement"] || 0}
                        </div>
                        <div className="text-gray-500">Replace</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">
                          {lab["For Upgrade"] || 0}
                        </div>
                        <div className="text-gray-500">Upgrade</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">
                          {lab["For Disposal"] || 0}
                        </div>
                        <div className="text-gray-500">Disposal</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preventive Maintenance Analytics */}
        {maintenanceData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Preventive Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {maintenanceData.completionRate}%
                </div>
                <div className="text-sm text-gray-600">
                  Completion Rate ({maintenanceData.currentQuarter} Quarter)
                </div>
                <div className="text-lg font-semibold text-green-600 mt-2">
                  {maintenanceData.completedReports}
                </div>
                <div className="text-xs text-gray-500">Reports Completed</div>
                <div className="text-lg font-semibold text-gray-700 mt-2">
                  {maintenanceData.totalWorkstations}
                </div>
                <div className="text-xs text-gray-500">Total Workstations</div>
              </div>

              {/* Per-Lab Breakdown for Admin */}
              {maintenanceData.perLabAnalytics &&
                maintenanceData.perLabAnalytics.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Lab Performance
                    </h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={maintenanceData.perLabAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="lab_name"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={10}
                        />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Bar
                          dataKey="completionRate"
                          fill="#10b981"
                          name="Completion %"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

              {/* Historical Data Section */}
              {maintenanceData.historicalData &&
                maintenanceData.historicalData.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Previous Quarters
                    </h4>
                    <div className="space-y-2">
                      {maintenanceData.historicalData.map((quarter) => (
                        <div key={quarter.quarter} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {quarter.quarter} Quarter
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              {quarter.completedReports} completed
                            </span>
                            <span className={`font-medium ${
                              quarter.completionRate > 0 ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {quarter.completionRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Complaints Analytics Bar Chart */}
        {complaintsData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                Complaints by Laboratory
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Date Filters */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={complaintsStartDate}
                      onChange={(e) => setComplaintsStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={complaintsEndDate}
                      onChange={(e) => setComplaintsEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setComplaintsStartDate(`${currentYear}-01-01`);
                        setComplaintsEndDate(`${currentYear}-12-31`);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {complaintsData.totalComplaints}
                </div>
                <div className="text-sm text-gray-600">Total Complaints</div>
                <div className="text-lg font-semibold text-green-600 mt-2">
                  {complaintsData.totalResolvedComplaints}
                </div>
                <div className="text-xs text-gray-500">Resolved Complaints</div>
                <div className="text-lg font-semibold text-gray-700 mt-2">
                  {complaintsData.totalComplaints -
                    complaintsData.totalResolvedComplaints}
                </div>
                <div className="text-xs text-gray-500">Active Complaints</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={complaintsData.labComplaints.map((lab) => ({
                    ...lab,
                    active_count: lab.total_count - lab.resolved_count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="lab_name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total_count" fill="#3b82f6" name="Total" />
                  <Bar
                    dataKey="resolved_count"
                    fill="#10b981"
                    name="Resolved"
                  />
                  <Bar dataKey="active_count" fill="#f59e0b" name="Active" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InventoryAnalyticsSection;
