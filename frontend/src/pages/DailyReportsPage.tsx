import React from 'react';
import DailyReportList from '../components/daily-report/DailyReportList';

const DailyReportsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DailyReportList />
    </div>
  );
};

export default DailyReportsPage;
