import React from 'react';
import { Card, CardContent } from '../ui/card';

interface AssetTimelineProps {
  asset_id: number;
  asset_name: string;
  unit_name?: string;
  workstation_name: string;
  lab_name: string;
  purchase_date: string;
  current_age_years: number;
  timeline_position: number;
}

const AssetTimeline: React.FC<AssetTimelineProps> = ({
  asset_id,
  asset_name,
  unit_name,
  workstation_name,
  lab_name,
  purchase_date,
  current_age_years,
  timeline_position
}) => {
  // Calculate years from purchase date
  const purchaseDateObj = new Date(purchase_date);
  const yearsSincePurchase = current_age_years;
  const currentYear = timeline_position; // Use the backend-calculated position directly

  // Generate timeline data
  const timelineYears = Array.from({ length: 6 }, (_, i) => i); // 0, 1, 2, 3, 4, 5

  return (
    <Card className="w-full h-28">
      <CardContent className="p-3">
        {/* Asset Header */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium truncate max-w-[100px]">
              {unit_name || asset_name || `Asset #${asset_id}`}
            </span>
            <span className="text-[10px] text-gray-500">
              {yearsSincePurchase}y
            </span>
          </div>
          <div className="flex justify-between text-[9px] text-gray-500">
            <span className="truncate max-w-[60px]">{workstation_name}</span>
            <span className="truncate max-w-[60px] text-right">{lab_name}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-2 left-2 right-2 h-0.5 bg-gray-300"></div>

          {/* Timeline dots */}
          <div className="relative flex justify-between items-center px-2">
            {timelineYears.map((year) => {
              const isActive = year <= currentYear;
              const isCurrent = year === currentYear;

              return (
                <div key={year} className="flex flex-col items-center">
                  {/* Simple dot */}
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive
                        ? isCurrent
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  ></div>
                </div>
              );
            })}
          </div>

          {/* Year labels */}
          <div className="flex justify-between px-2 mt-1">
            {timelineYears.map((year) => (
              <span key={year} className="text-[8px] text-gray-500 font-mono">
                {year === 0 ? 'Y1' : `Y${year}`}
              </span>
            ))}
          </div>
        </div>

        {/* Purchase date */}
        <div className="text-center mt-1">
          <span className="text-[9px] text-gray-400">
            {purchaseDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetTimeline;
