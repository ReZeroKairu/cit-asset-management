import React from 'react';
import DailyReportList from '../components/daily-report/DailyReportList';
import { useAuth } from '../context/AuthContext';

const DailyReportsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.role === 'Admin' ? 'Report Management' : 'Daily Accomplishment Reports'}
            </h1>
            <p className="mt-2 text-gray-600">
              {user?.role === 'Admin' 
                ? 'Review and manage daily accomplishment reports submitted by custodians.'
                : 'Create and manage your daily accomplishment reports for laboratory activities.'
              }
            </p>
          </div>

          {/* Role-based content */}
          {user?.role === 'Admin' ? (
            // Admin sees all reports with management controls
            <DailyReportList viewMode="all" adminMode={true} />
          ) : (
            // Custodians see only their own reports with create/edit controls
            <DailyReportList viewMode="my" adminMode={false} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReportsPage;
