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
  totalWorkstations?: number;
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
  title = "Asset Lifecycle Distribution", 
  totalWorkstations: propTotalWorkstations 
}) => {
  const [viewMode] = useState<'years'>('years');

  // Process data for years chart only
  const chartData = useMemo(() => {
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
  }, [data]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = data.length;
    const avgAge = total > 0 
      ? (data.reduce((sum, asset) => sum + (asset.current_age_years || 0), 0) / total).toFixed(1)
      : '0.0';
    
    // Use the passed totalWorkstations or fall back to calculation
    const totalWorkstations = propTotalWorkstations !== undefined 
      ? propTotalWorkstations 
      : new Set(
          data
            .filter(asset => asset.workstation_name && asset.workstation_name !== "Not Assigned")
            .map(asset => asset.workstation_name)
        ).size;

    return {
      total,
      avgAge,
      totalWorkstations,
      agingAssets: 0,
      newAssets: 0,
      agingPercentage: '0',
      newPercentage: '0'
    };
  }, [data, propTotalWorkstations]);

  const renderChart = () => {
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
  };

  return (
    <Card className="h-fit max-h-[600px] overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{title}</CardTitle>
            <div className="text-xs text-gray-600 font-medium">
              By Years
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-[530px] px-3 py-2">
        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-1 mb-3">
          <div className="text-center p-1 bg-purple-50 rounded">
            <div className="text-sm font-bold text-purple-600">{summaryStats.totalWorkstations || 0}</div>
            <div className="text-xs text-gray-600">Workstations</div>
          </div>
          <div className="text-center p-1 bg-gray-50 rounded">
            <div className="text-sm font-bold text-gray-900">{summaryStats.total}</div>
            <div className="text-xs text-gray-600">Assets</div>
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
        {data.length > 0 && (
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
