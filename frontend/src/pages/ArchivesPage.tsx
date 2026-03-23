import { useState } from "react";
import { FileText, Calendar, MessageSquare, Users } from "lucide-react";
import DailyReportList from "../components/daily-report/DailyReportList";
import ArchiveComplaintsPage from "./ArchiveComplaintsPage.tsx";
import ArchiveFormsPage from "./ArchiveFormsPage.tsx";
import ArchiveCITLabUsersPage from "./ArchiveCITLabUsersPage.tsx";

export const ArchivesPage = () => {
  const [activeTab, setActiveTab] = useState("reports");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Archives</h1>
        <p className="text-gray-600">
          View historical reports and form submissions
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("reports")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "reports"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Daily Reports
            </div>
          </button>
          <button
            onClick={() => setActiveTab("complaints")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "complaints"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Complaints
            </div>
          </button>
          <button
            onClick={() => setActiveTab("cit-lab-users")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "cit-lab-users"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              CIT Lab Users
            </div>
          </button>
          <button
            onClick={() => setActiveTab("forms")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "forms"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Forms
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "reports" && (
          <div>
            <DailyReportList
              viewMode="all"
              adminMode={false}
              archiveMode={true}
            />
          </div>
        )}
        {activeTab === "complaints" && (
          <div>
            <ArchiveComplaintsPage />
          </div>
        )}
        {activeTab === "cit-lab-users" && (
          <div>
            <ArchiveCITLabUsersPage />
          </div>
        )}
        {activeTab === "forms" && (
          <div>
            <ArchiveFormsPage />
          </div>
        )}
      </div>
    </div>
  );
};
