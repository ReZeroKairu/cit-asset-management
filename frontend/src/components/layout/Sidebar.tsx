//frontend/src/components/layout/Sidebar.tsx
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
  collapsed?: boolean;
}

const Sidebar = ({ active, onNavigate, collapsed = false }: SidebarProps) => {
  const { user, refreshUser } = useAuth();

  const handleRefreshUserData = async () => {
    try {
      await refreshUser();
      alert("User data refreshed successfully!");
      // Optionally reload the page to ensure all components update
      window.location.reload();
    } catch (error) {
      console.error("Refresh error:", error);
      alert(
        "Failed to refresh user data. Please check the console for details or try logging out and back in.",
      );
    }
  };

  return (
    <aside
      className={`bg-gray-800 text-white flex flex-col h-full relative ${
        collapsed ? "w-16" : "w-60"
      }`}
      style={{
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'width'
      }}
    >
      <div
        className={`p-4 border-b border-gray-700 overflow-hidden relative ${
          collapsed ? "flex justify-center" : ""
        }`}
        style={{
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'width'
        }}
      >
        <a
          href="/"
          className={`text-xl font-light hover:text-gray-300 whitespace-nowrap ${
            collapsed ? "text-center" : ""
          }`}
          style={{
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: collapsed ? 0 : 1
          }}
        >
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: collapsed ? 'translateX(-100%)' : 'translateX(0)'
          }}>
            CIT Asset Management
          </span>
        </a>
        {collapsed && (
          <span 
            className="text-xl font-light hover:text-gray-300"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 1,
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            CIT
          </span>
        )}
      </div>
      <div className="flex-1">
        <nav className={`${collapsed ? "px-2" : "px-4 pt-4 pb-0"}`}>
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full text-left rounded-md flex items-center transition-colors relative overflow-hidden ${
                  active === "home"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                } px-4 py-2`}
                onClick={() => onNavigate("home")}
                title={collapsed ? "Home" : ""}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span 
                  style={{
                    marginLeft: collapsed ? '0' : '12px',
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    whiteSpace: 'nowrap',
                    position: collapsed ? 'absolute' : 'relative'
                  }}
                >
                  Home
                </span>
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left rounded-md flex items-center transition-colors relative overflow-hidden ${
                  active === "inventory"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                } px-4 py-2`}
                onClick={() => onNavigate("inventory")}
                title={collapsed ? "Inventory" : ""}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <span 
                  style={{
                    marginLeft: collapsed ? '0' : '12px',
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    whiteSpace: 'nowrap',
                    position: collapsed ? 'absolute' : 'relative'
                  }}
                >
                  CIT Inventory
                </span>
              </button>
            </li>
            {user?.role === "Admin" && (
              <li>
                <button
                  className={`w-full text-left rounded-md flex items-center transition-colors relative overflow-hidden ${
                    active === "labs"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700 text-gray-300"
                  } px-4 py-2`}
                  onClick={() => onNavigate("labs")}
                  title={collapsed ? "Laboratories" : ""}
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span 
                    style={{
                      marginLeft: collapsed ? '0' : '12px',
                      opacity: collapsed ? 0 : 1,
                      transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap',
                      position: collapsed ? 'absolute' : 'relative'
                    }}
                  >
                    Laboratories
                  </span>
                </button>
              </li>
            )}
            {user?.role !== "Admin" && (
              <li>
                <button
                  className={`w-full text-left rounded-md flex items-center transition-colors relative overflow-hidden ${
                    active === "reports"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700 text-gray-300"
                  } px-4 py-2`}
                  onClick={() => onNavigate("reports")}
                  title={collapsed ? "My Reports" : ""}
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  <span 
                    style={{
                      marginLeft: collapsed ? '0' : '12px',
                      opacity: collapsed ? 0 : 1,
                      transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap',
                      position: collapsed ? 'absolute' : 'relative'
                    }}
                  >
                    My Reports
                  </span>
                </button>
              </li>
            )}
            {user?.role === "Admin" && (
              <li>
                <button
                  className={`w-full text-left rounded-md flex items-center transition-colors relative overflow-hidden ${
                    active === "admin-reports"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700 text-gray-300"
                  } px-4 py-2`}
                  onClick={() => onNavigate("admin-reports")}
                  title={collapsed ? "Daily Reports" : ""}
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  <span 
                    style={{
                      marginLeft: collapsed ? '0' : '12px',
                      opacity: collapsed ? 0 : 1,
                      transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap',
                      position: collapsed ? 'absolute' : 'relative'
                    }}
                  >
                    Daily Reports
                  </span>
                </button>
              </li>
            )}
            {/* Forms - Available to all users */}
            <li>
              <button
                className={`w-full text-left rounded-md flex items-center transition-colors relative overflow-hidden ${
                  active === "forms"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                } px-4 py-2`}
                onClick={() => onNavigate("forms")}
                title={collapsed ? "Forms" : ""}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2v5a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <span 
                  style={{
                    marginLeft: collapsed ? '0' : '12px',
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    whiteSpace: 'nowrap',
                    position: collapsed ? 'absolute' : 'relative'
                  }}
                >
                  Forms
                </span>
              </button>
            </li>
            {/* Complaints Management - Only for Custodians */}
            {user?.role === "Custodian" && (
              <li>
                <button
                  className={`w-full text-left rounded-md flex items-center transition-colors relative overflow-hidden ${
                    active === "complaints-management"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700 text-gray-300"
                  } px-4 py-2`}
                  onClick={() => onNavigate("complaints-management")}
                  title={collapsed ? "Complaints Management" : ""}
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949M3 20.635a9.863 9.863 0 01-4.255-.949M3 3.512a9.863 9.863 0 014.255-.949M21 3.512a9.863 9.863 0 014.255.949M9 7h.01M15 7h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span 
                    style={{
                      marginLeft: collapsed ? '0' : '12px',
                      opacity: collapsed ? 0 : 1,
                      transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap',
                      position: collapsed ? 'absolute' : 'relative'
                    }}
                  >
                    Complaints
                  </span>
                </button>
              </li>
            )}
            {user?.role === "Admin" && (
              <li>
                <button
                  className={`w-full text-left rounded-md flex items-center transition-colors relative overflow-hidden ${
                    active === "user-management"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700 text-gray-300"
                  } px-4 py-2`}
                  onClick={() => onNavigate("user-management")}
                  title={collapsed ? "User Management" : ""}
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span 
                    style={{
                      marginLeft: collapsed ? '0' : '12px',
                      opacity: collapsed ? 0 : 1,
                      transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap',
                      position: collapsed ? 'absolute' : 'relative'
                    }}
                  >
                    User Management
                  </span>
                </button>
              </li>
            )}
            {user?.role !== "Admin" && (
            <li>
              <button
                className={`w-full text-left rounded-md flex items-center transition-colors relative overflow-hidden ${
                  active === "maintenance"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                } px-4 py-2`}
                onClick={() => onNavigate("maintenance")}
                title={collapsed ? "Maintenance & Services" : ""}
              >
                {/* Wrench Icon */}
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span 
                  style={{
                    marginLeft: collapsed ? '0' : '12px',
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    whiteSpace: 'nowrap',
                    position: collapsed ? 'absolute' : 'relative'
                  }}
                >
                  Maintenance
                </span>
              </button>
            </li>
            )}
            {/* Archives - Available to all users */}
            <li>
              <button
                className={`w-full text-left rounded-md flex items-center transition-colors relative overflow-hidden ${
                  active === "archives"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                } px-4 py-2`}
                onClick={() => onNavigate("archives")}
                title={collapsed ? "Archives" : ""}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                <span 
                  style={{
                    marginLeft: collapsed ? '0' : '12px',
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    whiteSpace: 'nowrap',
                    position: collapsed ? 'absolute' : 'relative'
                  }}
                >
                  Archives
                </span>
              </button>
            </li>
            {/* Refresh User Data Button */}
            <li className="pt-4 border-t border-gray-700">
              <button
                className={`w-full text-left rounded-md flex items-center transition-colors hover:bg-gray-700 text-gray-300 relative overflow-hidden px-4 py-2`}
                onClick={handleRefreshUserData}
                title={collapsed ? "Refresh User Data" : ""}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span 
                  style={{
                    marginLeft: collapsed ? '0' : '12px',
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    whiteSpace: 'nowrap',
                    position: collapsed ? 'absolute' : 'relative'
                  }}
                >
                  Refresh User Data
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
