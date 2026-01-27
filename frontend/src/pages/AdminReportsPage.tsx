import React from 'react';
import DailyReportList from '../components/daily-report/DailyReportList';
import { useAuth } from '../context/AuthContext';

const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Report Management</h1>
            <p className="mt-2 text-gray-600">
              Review and manage daily accomplishment reports submitted by custodians.
            </p>
          </div>

          {/* Admin can view all reports from all users */}
          <DailyReportList viewMode="all" adminMode={true} />
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
