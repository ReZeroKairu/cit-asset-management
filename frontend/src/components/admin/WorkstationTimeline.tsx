import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';

interface WorkstationTimelineProps {
  workstation_name: string;
  assets: Array<{
    asset_id: number;
    asset_name: string;
    unit_name?: string;
    purchase_date: string;
    current_age_years: number;
    timeline_position: number;
  }>;
  yearFilter?: string;
}

const WorkstationTimeline: React.FC<WorkstationTimelineProps> = ({
  workstation_name,
  assets
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Sort assets by age (newest first)
  const sortedAssets = [...assets].sort((a, b) => b.current_age_years - a.current_age_years);

  // Generate timeline data for 5 columns (Y1, Y2, Y3, Y4, Y5)
  // 0-1 → Y1, 2 → Y2, 3 → Y3, 4 → Y4, 5 → Y5
  const timelineData = [
    { year: 1, positions: [0, 1], label: 'Y1' },  // Y1 combines positions 0 and 1
    { year: 2, positions: [2], label: 'Y2' },     // Y2 is position 2
    { year: 3, positions: [3], label: 'Y3' },     // Y3 is position 3
    { year: 4, positions: [4], label: 'Y4' },     // Y4 is position 4
    { year: 5, positions: [5], label: 'Y5' },     // Y5 is position 5
  ];

  return (
    <Card 
      className="w-full h-36 relative border border-gray-200 shadow hover:shadow-md transition-shadow duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-3">
        {/* Workstation Header */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium truncate max-w-[140px] text-gray-900">
              {workstation_name}
            </span>
            <span className="text-xs text-gray-600">
              {assets.length} assets
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Hover to view →
          </div>
        </div>

        {/* Mini Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-2 left-2 right-2 h-0.5 bg-gray-300"></div>

          {/* Timeline dots showing asset distribution */}
          <div className="relative flex justify-between items-center px-2">
            {timelineData.map((data) => {
              const assetsInYear = assets.filter(asset => data.positions.includes(asset.timeline_position));
              const hasAssets = assetsInYear.length > 0;
              
              return (
                <div key={data.year} className="flex flex-col items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      hasAssets
                        ? 'bg-gray-600'
                        : 'bg-gray-300'
                    }`}
                  ></div>
                  {hasAssets && (
                    <div className="text-xs text-gray-700 mt-1">
                      {assetsInYear.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Year labels */}
          <div className="flex justify-between px-2 mt-2">
            {timelineData.map((data) => (
              <span key={data.year} className="text-xs text-gray-600 font-mono">
                {data.label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[320px] max-w-[400px]">
          {/* Header */}
          <div className="mb-3 pb-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900">{workstation_name}</h4>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-700">{assets.length} Assets</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
          
          {/* Asset Distribution Summary */}
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <div className="text-sm font-bold text-gray-800 mb-2">Asset Distribution</div>
            <div className="grid grid-cols-5 gap-1 text-center">
              {timelineData.map((data) => {
                const assetsInYear = assets.filter(asset => data.positions.includes(asset.timeline_position));
                const count = assetsInYear.length;
                return (
                  <div key={data.year} className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${
                      count > 0 ? 'bg-gray-600' : 'bg-gray-300'
                    }`}></div>
                    <div className="text-sm font-bold text-gray-800 mt-1">{count}</div>
                    <div className="text-xs font-medium text-gray-600">
                      {data.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Asset List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="text-sm font-bold text-gray-800 mb-2">Asset Details</div>
            {sortedAssets.map((asset, index) => (
              <div key={asset.asset_id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      asset.timeline_position === 0 ? 'bg-gray-600' :
                      asset.timeline_position === 1 ? 'bg-gray-600' :
                      asset.timeline_position === 2 ? 'bg-green-600' :
                      asset.timeline_position === 3 ? 'bg-yellow-600' :
                      asset.timeline_position === 4 ? 'bg-orange-600' :
                      'bg-red-600'
                    }`}></div>
                    <div className="font-bold text-sm text-gray-900 truncate">
                      {asset.unit_name || asset.asset_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-gray-800">{asset.current_age_years}y</span>
                      <span className="text-gray-400">•</span>
                      <span className="font-bold text-gray-800">
                        {(() => {
                          const yearData = timelineData.find(d => d.positions.includes(asset.timeline_position));
                          return yearData ? yearData.label : `Y${asset.timeline_position}`;
                        })()}
                      </span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-700">{new Date(asset.purchase_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: '2-digit' 
                    })}</span>
                  </div>
                </div>
                <div className="ml-2 text-right">
                  <div className="text-xs font-mono font-bold text-gray-600">
                    #{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default WorkstationTimeline;
