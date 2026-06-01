import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { createPortal } from 'react-dom';

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
      
      // Calculate required dimensions with smart limits for long lists
      const overlayWidth = 300;
      const maxListHeight = Math.max(200, viewportHeight * 0.4); // Max 40% of viewport or 200px minimum
      const estimatedContentHeight = 120 + (assets.length * 35);
      const overlayHeight = Math.min(maxListHeight, estimatedContentHeight);
      
      // Calculate available space and best position
      const spaceAbove = rect.top - 20;
      const spaceBelow = viewportHeight - rect.bottom - 20;
      const spaceLeft = rect.left - 20;
      const spaceRight = viewportWidth - rect.right - 20;
      
      // Determine best horizontal position
      let horizontalPosition: 'left' | 'right' | 'center';
      if (spaceRight >= overlayWidth) {
        horizontalPosition = 'right'; // Show to the right
      } else if (spaceLeft >= overlayWidth) {
        horizontalPosition = 'left'; // Show to the left
      } else {
        horizontalPosition = 'center'; // Show centered
      }
      
      // Determine best vertical position
      let verticalPosition: 'top' | 'bottom' | 'center';
      if (spaceBelow >= overlayHeight) {
        verticalPosition = 'bottom'; // Show below
      } else if (spaceAbove >= overlayHeight) {
        verticalPosition = 'top'; // Show above
      } else {
        verticalPosition = 'center'; // Show centered
      }
      
      // Combine positions
      if (horizontalPosition === 'center' && verticalPosition === 'center') {
        setOverlayPosition('bottom'); // Default fallback
      } else if (horizontalPosition === 'center') {
        setOverlayPosition(verticalPosition === 'top' ? 'top' : 'bottom');
      } else {
        setOverlayPosition(horizontalPosition);
      }
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
              <span title={workstation_name}>{workstation_name.length > 20 ? `${workstation_name.substring(0, 17)}...` : workstation_name}</span>
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
                        ? (
                          data.year === 1 ? 'bg-blue-600' :
                          data.year === 2 ? 'bg-green-600' :
                          data.year === 3 ? 'bg-yellow-600' :
                          data.year === 4 ? 'bg-orange-600' :
                          'bg-red-600'
                        )
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
            {timelineData.map((data) => {
              const assetsInYear = assets.filter(asset => data.positions.includes(asset.timeline_position));
              const hasAssets = assetsInYear.length > 0;
              const labelColor = hasAssets ? (
                data.year === 1 ? 'text-blue-600' :
                data.year === 2 ? 'text-green-600' :
                data.year === 3 ? 'text-yellow-600' :
                data.year === 4 ? 'text-orange-600' :
                'text-red-600'
              ) : 'text-gray-600';
              return (
                <span key={data.year} className={`text-xs font-mono ${labelColor}`}>
                  {data.label}
                </span>
              );
            })}
          </div>
        </div>
      </CardContent>

      {/* Hover Overlay - Rendered via portal to escape container clipping */}
      {isHovered && cardRef.current && createPortal(
        <div 
          className="
            bg-white border border-gray-200 rounded-lg shadow-lg z-9999 p-3 
            overflow-y-auto fixed
          "
          style={{
            // Smart positioning to stay within viewport
            top: (() => {
              const rect = cardRef.current!.getBoundingClientRect();
              const overlayHeight = Math.min(350, Math.max(200, window.innerHeight * 0.4));
              
              if (overlayPosition === 'top') {
                return Math.max(10, rect.top - overlayHeight - 10);
              } else if (overlayPosition === 'bottom') {
                const bottomPos = rect.bottom + 10;
                return bottomPos + overlayHeight > window.innerHeight 
                  ? Math.max(10, window.innerHeight - overlayHeight - 10)
                  : bottomPos;
              } else {
                // Center vertically for left/right positioning
                const centerY = rect.top + (rect.height / 2) - (overlayHeight / 2);
                return Math.max(10, Math.min(centerY, window.innerHeight - overlayHeight - 10));
              }
            })(),
            left: (() => {
              const rect = cardRef.current!.getBoundingClientRect();
              const overlayWidth = overlayPosition === 'left' || overlayPosition === 'right' ? 280 : 300;
              
              if (overlayPosition === 'left') {
                return Math.max(10, rect.left - overlayWidth - 10);
              } else if (overlayPosition === 'right') {
                const rightPos = rect.right + 10;
                return rightPos + overlayWidth > window.innerWidth 
                  ? Math.max(10, window.innerWidth - overlayWidth - 10)
                  : rightPos;
              } else {
                // Center horizontally for top/bottom positioning
                const centerX = rect.left + (rect.width / 2) - (overlayWidth / 2);
                return Math.max(10, Math.min(centerX, window.innerWidth - overlayWidth - 10));
              }
            })(),
            maxHeight: '350px',
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
                const dotColor = count > 0 ? (
                  data.year === 1 ? 'bg-blue-600' :
                  data.year === 2 ? 'bg-green-600' :
                  data.year === 3 ? 'bg-yellow-600' :
                  data.year === 4 ? 'bg-orange-600' :
                  'bg-red-600'
                ) : 'bg-gray-300';
                const labelColor = count > 0 ? (
                  data.year === 1 ? 'text-blue-600' :
                  data.year === 2 ? 'text-green-600' :
                  data.year === 3 ? 'text-yellow-600' :
                  data.year === 4 ? 'text-orange-600' :
                  'text-red-600'
                ) : 'text-gray-600';
                return (
                  <div key={data.year} className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                    <div className={`text-sm font-bold mt-1 ${
                      count > 0 ? (
                        data.year === 1 ? 'text-blue-600' :
                        data.year === 2 ? 'text-green-600' :
                        data.year === 3 ? 'text-yellow-600' :
                        data.year === 4 ? 'text-orange-600' :
                        'text-red-600'
                      ) : 'text-gray-800'
                    }`}>{count}</div>
                    <div className={`text-xs font-medium ${labelColor}`}>
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
                        asset.timeline_position === 1 ? 'bg-blue-600' :
                        asset.timeline_position === 2 ? 'bg-green-600' :
                        asset.timeline_position === 3 ? 'bg-yellow-600' :
                        asset.timeline_position === 4 ? 'bg-orange-600' :
                        'bg-red-600'
                      }`}></div>
                      <div className="font-bold text-gray-900 truncate">
                        {asset.unit_name || asset.asset_name}
                        <span title={asset.unit_name || asset.asset_name}>{(asset.unit_name || asset.asset_name).length > 20 ? `${(asset.unit_name || asset.asset_name).substring(0, 17)}...` : (asset.unit_name || asset.asset_name)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-bold text-gray-800">{asset.current_age_years}y</span>
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
        </div>,
        document.body
      )}
    </Card>
  );
};

export default WorkstationTimeline;
