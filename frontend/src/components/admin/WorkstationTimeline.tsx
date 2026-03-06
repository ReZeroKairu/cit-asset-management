import React, { useState, useRef, useEffect } from 'react';
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
  const [overlayPosition, setOverlayPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate overlay position when hovering
  useEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate available space in all directions
      const spaceAbove = rect.top - 20;
      const spaceBelow = viewportHeight - rect.bottom - 20;
      const spaceLeft = rect.left - 20;
      const spaceRight = viewportWidth - rect.right - 20;
      
      // Calculate required dimensions with smart limits for long lists
      const overlayWidth = 300;
      const maxListHeight = Math.max(200, viewportHeight * 0.4); // Max 40% of viewport or 200px minimum
      const estimatedContentHeight = 120 + (assets.length * 35);
      const overlayHeight = Math.min(maxListHeight, estimatedContentHeight);
      
      // For very long lists, prioritize horizontal positioning (better for scrolling)
      const isLongList = assets.length > 8;
      
      // Find best position with most space
      const positions = [
        { dir: 'bottom', space: spaceBelow, width: overlayWidth, height: overlayHeight, priority: isLongList ? 0.8 : 1 },
        { dir: 'top', space: spaceAbove, width: overlayWidth, height: overlayHeight, priority: isLongList ? 0.8 : 1 },
        { dir: 'right', space: spaceRight, width: overlayWidth, height: overlayHeight, priority: isLongList ? 1.2 : 0.9 },
        { dir: 'left', space: spaceLeft, width: overlayWidth, height: overlayHeight, priority: isLongList ? 1.2 : 0.9 }
      ];
      
      // Sort by available space and priority, pick the best fit
      const bestPosition = positions
        .filter(p => (p.dir === 'bottom' || p.dir === 'top') ? p.space >= Math.min(200, p.height) : p.space >= p.width)
        .sort((a, b) => (b.space * b.priority) - (a.space * a.priority))[0]?.dir || 'bottom';
      
      setOverlayPosition(bestPosition as any);
    }
  }, [isHovered, assets.length]);

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
      ref={cardRef}
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
        <div 
          className={`
            bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 
            overflow-y-auto
            absolute
            ${overlayPosition === 'top' ? 'bottom-full mb-2 left-0 right-0' : ''}
            ${overlayPosition === 'bottom' ? 'top-full mt-2 left-0 right-0' : ''}
            ${overlayPosition === 'left' ? 'right-full mr-2 top-0' : ''}
            ${overlayPosition === 'right' ? 'left-full ml-2 top-0' : ''}
          `}
          style={{
            maxHeight: overlayPosition === 'top' 
              ? `${Math.min(350, cardRef.current?.getBoundingClientRect().top || 350 - 40)}px`
              : overlayPosition === 'bottom'
              ? `${Math.min(350, window.innerHeight - (cardRef.current?.getBoundingClientRect().bottom || window.innerHeight) - 40)}px`
              : overlayPosition === 'left' || overlayPosition === 'right'
              ? `${Math.min(350, window.innerHeight - 40)}px`
              : '350px',
            width: overlayPosition === 'left' || overlayPosition === 'right' ? '280px' : 'auto',
            minWidth: overlayPosition === 'left' || overlayPosition === 'right' ? '280px' : '260px',
            maxWidth: overlayPosition === 'left' || overlayPosition === 'right' ? '280px' : '320px'
          }}
        >
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
          <div className="space-y-1 overflow-y-auto">
            <div className="text-xs font-bold text-gray-800 mb-1 sticky top-0 bg-white pb-1 flex justify-between items-center">
              <span>Asset Details</span>
              {assets.length > 8 && (
                <span className="text-xs text-blue-600 font-normal">
                  Scroll to see all {assets.length} assets
                </span>
              )}
            </div>
            {sortedAssets.length === 0 ? (
              <div className="text-center py-2 text-gray-500 text-xs">
                No assets assigned to this workstation
              </div>
            ) : (
              sortedAssets.map((asset, index) => (
                <div key={asset.asset_id} className="flex items-center justify-between p-1.5 bg-white border border-gray-100 rounded hover:bg-gray-50 transition-colors text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        asset.timeline_position === 0 ? 'bg-gray-600' :
                        asset.timeline_position === 1 ? 'bg-gray-600' :
                        asset.timeline_position === 2 ? 'bg-green-600' :
                        asset.timeline_position === 3 ? 'bg-yellow-600' :
                        asset.timeline_position === 4 ? 'bg-orange-600' :
                        'bg-red-600'
                      }`}></div>
                      <div className="font-bold text-gray-900 truncate">
                        {asset.unit_name || asset.asset_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
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
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default WorkstationTimeline;
