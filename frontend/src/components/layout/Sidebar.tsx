import React from 'react';

interface SidebarProps {
  activePage: 'home' | 'inventory' | 'daily_report';
}

const Sidebar: React.FC<SidebarProps> = ({ activePage }) => {
  return (
    <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
      {/* Brand Logo */}
      <div className="sidebar-brand">
        <a href="/" className="brand-link">
          <span className="brand-text fw-light">CIT Asset Mgr</span>
        </a>
      </div>

      {/* Sidebar Menu */}
      <div className="sidebar-wrapper">
        <nav className="mt-2">
          <ul className="nav sidebar-menu flex-column" role="menu">
            
            <li className="nav-item">
              <a href="/home" className={`nav-link ${activePage === 'home' ? 'active' : ''}`}>
                <i className="nav-icon bi bi-speedometer"></i>
                <p>Home</p>
              </a>
            </li>

            <li className="nav-item">
              <a href="/inventory" className={`nav-link ${activePage === 'inventory' ? 'active bg-primary' : ''}`}>
                <i className="nav-icon bi bi-box-seam"></i>
                <p>CIT Inventory</p>
              </a>
            </li>

            <li className="nav-item">
              <a href="/reports" className={`nav-link ${activePage === 'daily_report' ? 'active' : ''}`}>
                <i className="nav-icon bi bi-clipboard-check"></i>
                <p>Daily Reports</p>
              </a>
            </li>

          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;