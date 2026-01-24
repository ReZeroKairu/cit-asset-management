import React from "react";

const Sidebar = ({ active }: { active: string }) => {
  return (
    <aside
      className="app-sidebar bg-body-secondary shadow"
      data-bs-theme="dark"
    >
      <div className="sidebar-brand">
        <a href="/" className="brand-link">
          <span className="brand-text fw-light">CIT Asset Mgr</span>
        </a>
      </div>
      <div className="sidebar-wrapper">
        <nav className="mt-2">
          <ul className="nav sidebar-menu flex-column">
            <li className="nav-item">
              <a
                href="#"
                className={`nav-link ${active === "home" ? "active" : ""}`}
              >
                <i className="nav-icon bi bi-speedometer"></i>
                <p>Home</p>
              </a>
            </li>
            <li className="nav-item">
              {/* Note: In a real app we use Link from react-router, 
          but for now we use simple # or onClick from App.tsx */}
              <a
                href="#"
                className={`nav-link ${active === "inventory" ? "active" : ""}`}
              >
                <i className="nav-icon bi bi-box-seam"></i>
                <p>CIT Inventory</p>
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#"
                className={`nav-link ${active === "reports" ? "active" : ""}`}
              >
                <i className="nav-icon bi bi-file-earmark-text"></i>
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
