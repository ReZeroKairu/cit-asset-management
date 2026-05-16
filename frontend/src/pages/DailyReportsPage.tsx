import React from "react";
import DailyReportList from "../components/daily-report/DailyReportList";

interface DailyReportsPageProps {
  defaultTab?: "list" | "create";
}

const DailyReportsPage: React.FC<DailyReportsPageProps> = ({ defaultTab }) => {
  return <DailyReportList defaultTab={defaultTab} />;
};

export default DailyReportsPage;
