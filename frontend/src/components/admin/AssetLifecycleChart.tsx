import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';

interface AssetLifecycleChartProps {
  data: Array<{
    asset_id: number;
    asset_name: string;
    unit_name?: string;
    purchase_date: string;
    current_age_years: number;
    timeline_position: number;
    workstation_name?: string;
  }>;
  title?: string;
}

const COLORS = {
  'Y1': '#3b82f6',   // Blue
  'Y2': '#10b981',   // Green  
  'Y3': '#f59e0b',   // Yellow
  'Y4': '#f97316',   // Orange
  'Y5': '#ef4444',   // Red
};

const AssetLifecycleChart: React.FC<AssetLifecycleChartProps> = ({ 
  data, 
  title = 'Asset Lifecycle Distribution' 
}) => {
  const [viewMode, setViewMode] = useState<'years' | 'workstations'>('years');

  // Process data for different chart types
  const chartData = useMemo(() => {
    if (viewMode === 'years') {
      // Group by lifecycle years
      const yearDistribution = [
        { year: 'Y1 (0-1 years)', count: 0, percentage: 0, color: COLORS.Y1 },
        { year: 'Y2 (2 years)', count: 0, percentage: 0, color: COLORS.Y2 },
        { year: 'Y3 (3 years)', count: 0, percentage: 0, color: COLORS.Y3 },
        { year: 'Y4 (4 years)', count: 0, percentage: 0, color: COLORS.Y4 },
        { year: 'Y5 (5+ years)', count: 0, percentage: 0, color: COLORS.Y5 },
      ];

      data.forEach(asset => {
        const position = asset.timeline_position;
        if (position === 0 || position === 1) yearDistribution[0].count++;
        else if (position === 2) yearDistribution[1].count++;
        else if (position === 3) yearDistribution[2].count++;
        else if (position === 4) yearDistribution[3].count++;
        else if (position === 5) yearDistribution[4].count++;
      });

      // Calculate percentages
      const total = yearDistribution.reduce((sum, item) => sum + item.count, 0);
      yearDistribution.forEach(item => {
        item.percentage = total > 0 ? (item.count / total) * 100 : 0;
      });

      return yearDistribution;
    } else {
      // Group by workstations
      const workstationMap = new Map();
      
      data.forEach(asset => {
        const wsName = asset.workstation_name || 'Unassigned';
        if (!workstationMap.has(wsName)) {
          workstationMap.set(wsName, {
            workstation: wsName,
            Y1: 0, Y2: 0, Y3: 0, Y4: 0, Y5: 0, total: 0
          });
        }
        
        const ws = workstationMap.get(wsName);
        const position = asset.timeline_position;
        
        if (position === 0 || position === 1) ws.Y1++;
        else if (position === 2) ws.Y2++;
        else if (position === 3) ws.Y3++;
        else if (position === 4) ws.Y4++;
        else if (position === 5) ws.Y5++;
        
        ws.total++;
      });

      return Array.from(workstationMap.values()).slice(0, 10); // Limit to top 10 workstations
    }
  }, [data, viewMode]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = data.length;
    const agingAssets = data.filter(asset => asset.timeline_position >= 4).length; // Y4 and Y5
    const newAssets = data.filter(asset => asset.timeline_position <= 1).length; // Y1
    const avgAge = data.length > 0 
      ? (data.reduce((sum, asset) => sum + asset.current_age_years, 0) / data.length).toFixed(1)
      : '0';

    return {
      total,
      agingAssets,
      newAssets,
      avgAge,
      agingPercentage: total > 0 ? ((agingAssets / total) * 100).toFixed(1) : '0',
      newPercentage: total > 0 ? ((newAssets / total) * 100).toFixed(1) : '0'
    };
  }, [data]);

  const renderChart = () => {
    // Always render bar chart
    if (viewMode === 'workstations') {
      const workstationCount = chartData.length;
      // Use dynamic height based on workstation count to prevent overcrowding
      const dynamicHeight = Math.min(220, Math.max(300, workstationCount * 25));
      
      return (
        <ResponsiveContainer width="100%" height={dynamicHeight}>
          <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="workstation" 
              type="category" 
              width={Math.max(80, Math.min(150, 600 / workstationCount))}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="Y1" stackId="a" fill={COLORS.Y1} />
            <Bar dataKey="Y2" stackId="a" fill={COLORS.Y2} />
            <Bar dataKey="Y3" stackId="a" fill={COLORS.Y3} />
            <Bar dataKey="Y4" stackId="a" fill={COLORS.Y4} />
            <Bar dataKey="Y5" stackId="a" fill={COLORS.Y5} />
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      // By Years view - optimize for large numbers
      const maxCount = Math.max(...chartData.map(d => d.count));
      const dynamicHeight = Math.min(300, Math.max(250, maxCount * 1.5));
      
      return (
        <ResponsiveContainer width="100%" height={dynamicHeight}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => [
                `${value || 0} assets`,
                `${((value || 0) / summaryStats.total * 100).toFixed(1)}%`
              ]}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card className="h-fit max-h-[600px] overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{title}</CardTitle>
            <div className="flex items-center gap-1">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'years' | 'workstations')}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="years">By Years</option>
                <option value="workstations">By Workstations</option>
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-[530px] px-3 py-2">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-3">
          <div className="text-center p-1 bg-gray-50 rounded">
            <div className="text-sm font-bold text-gray-900">{summaryStats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center p-1 bg-blue-50 rounded">
            <div className="text-sm font-bold text-blue-600">{summaryStats.newAssets}</div>
            <div className="text-xs text-gray-600">New</div>
            <div className="text-xs text-blue-600">{summaryStats.newPercentage}%</div>
          </div>
          <div className="text-center p-1 bg-orange-50 rounded">
            <div className="text-sm font-bold text-orange-600">{summaryStats.agingAssets}</div>
            <div className="text-xs text-gray-600">Aging</div>
            <div className="text-xs text-orange-600">{summaryStats.agingPercentage}%</div>
          </div>
          <div className="text-center p-1 bg-green-50 rounded">
            <div className="text-sm font-bold text-green-600">{summaryStats.avgAge}</div>
            <div className="text-xs text-gray-600">Avg</div>
          </div>
        </div>

        {/* Chart */}
        {data.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <div className="text-sm font-medium">No asset data available</div>
              <div className="text-xs">Assets will appear here once data is loaded</div>
            </div>
          </div>
        )}

        {/* Data Table */}
        {viewMode === 'years' && data.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-900 mb-1">Details</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-0.5 text-xs">Stage</th>
                    <th className="text-center py-0.5 text-xs">Count</th>
                    <th className="text-center py-0.5 text-xs">%</th>
                    <th className="text-left py-0.5 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-0.5 font-medium text-xs">{item.year}</td>
                      <td className="text-center py-0.5 text-xs">{item.count}</td>
                      <td className="text-center py-0.5 text-xs">{item.percentage.toFixed(1)}%</td>
                      <td className="py-0.5">
                        <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${
                          index <= 1 ? 'bg-green-100 text-green-800' :
                          index === 2 ? 'bg-yellow-100 text-yellow-800' :
                          index === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {index <= 1 ? 'Good' : index === 2 ? 'Monitor' : index === 3 ? 'Replace Soon' : 'Replace Now'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetLifecycleChart;
