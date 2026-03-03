import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getInventoryAnalytics, type InventoryAnalyticsData } from "../../api/inventoryAnalytics";
import AssetTimeline from "./AssetTimeline";

const COLORS = {
  "Functional": "#10b981",
  "For Replacement": "#f59e0b",
  "For Repair": "#3b82f6",
  "For Upgrade": "#8b5cf6",
  "Lost": "#ef4444"
};

const InventoryAnalyticsSection = () => {
  const [data, setData] = useState<InventoryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
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
      } catch (err) {
        console.error("Failed to fetch inventory analytics:", err);
        setError("Failed to load inventory analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Aggregate timeline data by lab and year
  const timelineSummary = data ? (() => {
    const summary: Record<string, { year1: number; year2: number; year3: number; year4: number; year5: number; total: number }> = {};

    data.timelineData.forEach(asset => {
      const lab = asset.lab_name || 'Not Assigned';
      const year = asset.timeline_position;

      if (!summary[lab]) {
        summary[lab] = { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, total: 0 };
      }

      if (year === 1) summary[lab].year1++;
      else if (year === 2) summary[lab].year2++;
      else if (year === 3) summary[lab].year3++;
      else if (year === 4) summary[lab].year4++;
      else summary[lab].year5++;

      summary[lab].total++;
    });

    return Object.entries(summary)
      .map(([lab, counts]) => ({ lab, ...counts }))
      .sort((a, b) => b.total - a.total); // Sort by total descending
  })() : [];

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </CardContent>
        </Card>

        {/* Laboratory Status Table */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs">Laboratory Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-1 py-0.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                      Lab
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">
                      Total
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">
                      Functional
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">
                      Replace
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">
                      Repair
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">
                      Upgrade
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">
                      Lost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.labStatusData.map((lab) => (
                    <tr key={lab.lab_name}>
                      <td className="px-1 py-0.5 text-[9px] font-medium text-gray-900 text-left">
                        {lab.lab_name.length > 10 ? lab.lab_name.substring(0, 8) + '..' : lab.lab_name}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-gray-500 text-center">
                        {lab.total}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-green-600 text-center">
                        {lab.Functional}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-yellow-600 text-center">
                        {lab["For Replacement"]}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-blue-600 text-center">
                        {lab["For Repair"]}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-purple-600 text-center">
                        {lab["For Upgrade"] ?? 0}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-red-600 text-center">
                        {lab.Lost ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Asset Timelines */}
        {data.timelineData && data.timelineData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle>Asset Lifecycle Timelines</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Lab:</span>
                    <select
                      value={selectedLab}
                      onChange={(e) => setSelectedLab(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="all">All Labs</option>
                      {[...new Set(data.timelineData.map(asset => asset.lab_name))].slice(0, 3).map(lab => (
                        <option key={lab} value={lab}>{lab}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Year:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="all">All Years</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                      <option value="5">Year 5+</option>
                    </select>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Track asset age from purchase date (showing most recent assets)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.timelineData
                  .filter(asset => {
                    const labMatch = selectedLab === 'all' || asset.lab_name === selectedLab;
                    const yearMatch = selectedYear === 'all' || asset.timeline_position.toString() === selectedYear;
                    return labMatch && yearMatch;
                  })
                  .slice(0, 6)
                  .map((asset) => (
                    <AssetTimeline
                      key={asset.asset_id}
                      {...asset}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Asset Lifecycle Timelines Summary Table */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs">Asset Lifecycle Timelines</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-1 py-0.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                      Lab
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">
                      Year 1
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">
                      Year 2
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">
                      Year 3
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">
                      Year 4
                    </th>
                    <th className="px-1 py-0.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">
                      Year 5+
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timelineSummary.map((row) => (
                    <tr key={row.lab}>
                      <td className="px-1 py-0.5 text-[9px] font-medium text-gray-900 text-left">
                        {row.lab.length > 10 ? row.lab.substring(0, 8) + '..' : row.lab}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-blue-600 text-center">
                        {row.year1}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-green-600 text-center">
                        {row.year2}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-yellow-600 text-center">
                        {row.year3}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-orange-600 text-center">
                        {row.year4}
                      </td>
                      <td className="px-1 py-0.5 text-[9px] text-red-600 text-center">
                        {row.year5}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryAnalyticsSection;
