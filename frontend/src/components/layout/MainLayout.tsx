import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import EditFiscalYearModal from "../modals/EditFiscalYearModal";

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentPage,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFiscalYearModal, setShowFiscalYearModal] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(
    user?.fiscal_year || "2025-2026",
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        active={currentPage}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700 border-r pr-4">
              <span className="text-gray-600">A.Y: {fiscalYear}</span>

              <div className="flex items-center space-x-2">
                {user?.role === "Admin" && (
                  <button
                    type="button"
                    className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    onClick={() => setShowFiscalYearModal(true)}
                    title="Edit Fiscal Year"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <span>
                | &nbsp;&nbsp;{user?.name} ({user?.role})
              </span>
            </div>
            <button
              type="button"
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center cursor-pointer"
              onClick={logout}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>

      {/* Edit Fiscal Year Modal */}
      {showFiscalYearModal && (
        <EditFiscalYearModal
          currentFiscalYear={fiscalYear}
          onClose={() => setShowFiscalYearModal(false)}
          onSave={(newFiscalYear) => {
            setFiscalYear(newFiscalYear);
            setShowFiscalYearModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MainLayout;
