import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{user?.name} ({user?.role})</span>
            <button 
              type="button"
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center"
              onClick={logout}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
