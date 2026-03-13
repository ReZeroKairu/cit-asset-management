import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getInventoryAnalytics, type InventoryAnalyticsData } from "../../api/inventoryAnalytics";
import { getComplaintsAnalytics, type ComplaintsAnalyticsData } from "../../api/complaints";
import { getMaintenanceAnalytics, type MaintenanceAnalyticsData } from "../../api/maintenance";

const COLORS = {
  "Functional": "#10b981",
  "For Replacement": "#f59e0b",
  "For Repair": "#3b82f6",
  "For Upgrade": "#8b5cf6",
  "Lost": "#ef4444"
};

const MAINTENANCE_COLORS = {
  "Functional": "#10b981",
  "Working": "#10b981",
  "Operational": "#10b981",
  "Needs Repair": "#f59e0b", 
  "For Repair": "#3b82f6",
  "Under Repair": "#3b82f6",
  "Critical": "#ef4444",
  "Urgent": "#ef4444",
  "Under Maintenance": "#8b5cf6",
  "Maintenance": "#8b5cf6",
  "Not Functional": "#ef4444",
  "Down": "#ef4444",
  "Offline": "#ef4444",
  "Issue": "#f59e0b",
  "Problem": "#f59e0b",
  "For Replacement": "#f59e0b",
  "For Upgrade": "#8b5cf6",
  "Lost": "#ef4444"
};

const InventoryAnalyticsSection = () => {
  const [data, setData] = useState<InventoryAnalyticsData | null>(null);
  const [complaintsData, setComplaintsData] = useState<ComplaintsAnalyticsData | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch inventory analytics
        const analyticsData = await getInventoryAnalytics();
        console.log('API Response:', analyticsData);

        // Transform the data to get Lost value from API
        const transformedData: InventoryAnalyticsData = {
          ...analyticsData,
          labStatusData: analyticsData.labStatusData.map(lab => {
            console.log('Lab data:', lab);
            console.log('All lab properties:', Object.keys(lab));
            // Get Lost value from lab data (provided by backend per-lab calculation)
            const lostValue = lab.Lost || 0;
            console.log('Lost value for lab', lab.lab_name, ':', lostValue);
            return {
              ...lab,
              Lost: lostValue, // Use Lost count for this specific lab
            };
          }),
          statusDistribution: analyticsData.statusDistribution
        };

        console.log('Transformed data:', transformedData);
        setData(transformedData);

        // Fetch complaints analytics
        const complaintsAnalyticsData = await getComplaintsAnalytics();
        console.log('Complaints Analytics Response:', complaintsAnalyticsData);
        setComplaintsData(complaintsAnalyticsData);

        // Fetch maintenance analytics
        const maintenanceAnalyticsData = await getMaintenanceAnalytics();
        console.log('Maintenance Analytics Response:', maintenanceAnalyticsData);
        console.log('Status Distribution:', maintenanceAnalyticsData.statusDistribution);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status Analytics</CardTitle>
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
          <CardTitle>Inventory Status Analytics</CardTitle>
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
          Inventory Status Analytics
        </h2>
        <p className="text-gray-600">
          Monitor asset status distribution and laboratory health scores
        </p>
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
                  label={(entry) => {
                    const dataItem = data.statusDistribution[entry.index];
                    return `${dataItem.status_name}: ${entry.percent ? (entry.percent * 100).toFixed(1) : '0.0'}%`;
                  }}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.status_name as keyof typeof COLORS] || "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {data.statusDistribution.map((status) => (
                <div key={status.status_name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[status.status_name as keyof typeof COLORS] || "#8884d8" }}
                  />
                  <span className="text-sm text-gray-600">
                    {status.status_name} ({status.count})
                  </span>
                </div>
              ))}
            </div>
            
            {/* System Status Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">System Status Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Assets:</span>
                  <span className="font-medium">{data.summary.totalAssets}</span>
                </div>
                {['Functional', 'For Replacement', 'For Repair', 'For Upgrade', 'Lost'].map((statusName) => {
                  const status = data.statusDistribution.find(s => s.status_name === statusName);
                  const count = status ? status.count : 0;
                  return (
                    <div key={statusName} className="flex justify-between">
                      <span 
                        className={
                          statusName === 'Functional' ? 'text-green-600' :
                          statusName === 'For Replacement' ? 'text-yellow-600' :
                          statusName === 'For Repair' ? 'text-blue-600' :
                          statusName === 'For Upgrade' ? 'text-purple-600' :
                          statusName === 'Lost' ? 'text-red-600' :
                          'text-gray-600'
                        }
                      >
                        {statusName === 'For Replacement' ? 'Replace' : 
                         statusName === 'For Repair' ? 'Repair' :
                         statusName === 'For Upgrade' ? 'Upgrade' :
                         statusName}:
                      </span>
                      <span 
                        className={`font-medium ${
                          statusName === 'Functional' ? 'text-green-600' :
                          statusName === 'For Replacement' ? 'text-yellow-600' :
                          statusName === 'For Repair' ? 'text-blue-600' :
                          statusName === 'For Upgrade' ? 'text-purple-600' :
                          statusName === 'Lost' ? 'text-red-600' :
                          'text-gray-600'
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
              <h4 className="text-sm font-medium text-gray-900 mb-3">Laboratory Status Breakdown</h4>
              <div className="space-y-3">
                {data.labStatusData.map((lab) => (
                  <div key={lab.lab_id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-medium text-gray-900">{lab.lab_name}</h5>
                      <span className="text-xs text-gray-500">{lab.total} assets</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-green-600">{lab.Functional || 0}</div>
                        <div className="text-gray-500">Functional</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-yellow-600">{lab['For Replacement'] || 0}</div>
                        <div className="text-gray-500">Replace</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{lab['For Repair'] || 0}</div>
                        <div className="text-gray-500">Repair</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">{lab['For Upgrade'] || 0}</div>
                        <div className="text-gray-500">Upgrade</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{lab.Lost || 0}</div>
                        <div className="text-gray-500">Lost</div>
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
                <div className="text-2xl font-bold text-blue-600">{maintenanceData.completionRate}%</div>
                <div className="text-sm text-gray-600">Completion Rate ({maintenanceData.currentQuarter} Quarter)</div>
                <div className="text-lg font-semibold text-green-600 mt-2">{maintenanceData.completedReports}</div>
                <div className="text-xs text-gray-500">Reports Completed</div>
                <div className="text-lg font-semibold text-gray-700 mt-2">{maintenanceData.totalWorkstations}</div>
                <div className="text-xs text-gray-500">Total Workstations</div>
              </div>
              
              {/* Per-Lab Breakdown for Admin */}
              {maintenanceData.perLabAnalytics && maintenanceData.perLabAnalytics.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Lab Performance</h4>
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
                      <Bar dataKey="completionRate" fill="#10b981" name="Completion %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Complaints Analytics Bar Chart */}
        {complaintsData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Complaints by Laboratory</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{complaintsData.totalComplaints}</div>
                <div className="text-sm text-gray-600">Total Complaints</div>
                <div className="text-lg font-semibold text-green-600 mt-2">{complaintsData.totalResolvedComplaints}</div>
                <div className="text-xs text-gray-500">Resolved Complaints</div>
                <div className="text-lg font-semibold text-gray-700 mt-2">{complaintsData.totalComplaints - complaintsData.totalResolvedComplaints}</div>
                <div className="text-xs text-gray-500">Active Complaints</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={complaintsData.labComplaints.map(lab => ({
                  ...lab,
                  active_count: lab.total_count - lab.resolved_count
                }))}>
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
                  <Bar dataKey="resolved_count" fill="#10b981" name="Resolved" />
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
