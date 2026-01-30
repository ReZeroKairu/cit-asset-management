//frontend/src/components/layout/Sidebar.tsx
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
  collapsed?: boolean;
}

const Sidebar = ({ active, onNavigate, collapsed = false }: SidebarProps) => {
  const { user } = useAuth();

  return (
    <aside className={`bg-gray-800 text-white flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className={`p-4 border-b border-gray-700 ${
        collapsed ? 'flex justify-center' : ''
      }`}>
        <a href="/" className={`text-xl font-light hover:text-gray-300 ${
          collapsed ? 'text-center' : ''
        }`}>
          {collapsed ? 'CIT' : 'CIT Asset Management'}
        </a>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className={`${collapsed ? 'px-2' : 'p-4'}`}>
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full text-left rounded-md flex items-center transition-colors ${
                  active === "home" 
                    ? "bg-blue-600 text-white" 
                    : "hover:bg-gray-700 text-gray-300"
                } ${
                  collapsed ? 'justify-center px-2 py-2' : 'px-4 py-2 space-x-3'
                }`}
                onClick={() => onNavigate("home")}
                title={collapsed ? "Home" : ""}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {!collapsed && <span>Home</span>}
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left rounded-md flex items-center transition-colors ${
                  active === "inventory" 
                    ? "bg-blue-600 text-white" 
                    : "hover:bg-gray-700 text-gray-300"
                } ${
                  collapsed ? 'justify-center px-2 py-2' : 'px-4 py-2 space-x-3'
                }`}
                onClick={() => onNavigate("inventory")}
                title={collapsed ? "Inventory" : ""}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {!collapsed && <span>CIT Inventory</span>}
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left rounded-md flex items-center transition-colors ${
                  active === "labs" 
                    ? "bg-blue-600 text-white" 
                    : "hover:bg-gray-700 text-gray-300"
                } ${
                  collapsed ? 'justify-center px-2 py-2' : 'px-4 py-2 space-x-3'
                }`}
                onClick={() => onNavigate("labs")}
                title={collapsed ? "Laboratories" : ""}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {!collapsed && <span>Laboratories</span>}
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left rounded-md flex items-center transition-colors ${
                  active === "reports" 
                    ? "bg-blue-600 text-white" 
                    : "hover:bg-gray-700 text-gray-300"
                } ${
                  collapsed ? 'justify-center px-2 py-2' : 'px-4 py-2 space-x-3'
                }`}
                onClick={() => onNavigate("reports")}
                title={collapsed ? "Reports" : ""}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {!collapsed && <span>Daily Reports</span>}
              </button>
            </li>
            {user?.role === 'Admin' && (
              <li>
                <button
                  className={`w-full text-left rounded-md flex items-center transition-colors ${
                    active === "user-management" 
                      ? "bg-blue-600 text-white" 
                      : "hover:bg-gray-700 text-gray-300"
                  } ${
                    collapsed ? 'justify-center px-2 py-2' : 'px-4 py-2 space-x-3'
                  }`}
                  onClick={() => onNavigate("user-management")}
                  title={collapsed ? "User Management" : ""}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {!collapsed && <span>User Management</span>}
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
