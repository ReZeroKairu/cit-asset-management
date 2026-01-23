function App() {
  return (
    // The wrapper class is required by AdminLTE
    <div className="app-wrapper">
      {/* Navbar */}
      <nav className="app-header navbar navbar-expand bg-body">
        <div className="container-fluid">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a
                className="nav-link"
                data-lte-toggle="sidebar"
                href="#"
                role="button"
              >
                ☰ {/* Simple Menu Icon */}
              </a>
            </li>
            <li className="nav-item d-none d-md-block">
              <a href="#" className="nav-link">
                Home
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className="app-sidebar bg-body-secondary shadow"
        data-bs-theme="dark"
      >
        <div className="sidebar-brand">
          <a href="#" className="brand-link">
            <span className="brand-text fw-light">CIT Asset Mgr</span>
          </a>
        </div>
        <div className="sidebar-wrapper">
          <nav className="mt-2">
            <ul
              className="nav sidebar-menu flex-column"
              data-lte-toggle="treeview"
              role="menu"
              data-accordion="false"
            >
              <li className="nav-item">
                <a href="#" className="nav-link active">
                  <p>Dashboard</p>
                </a>
              </li>
              <li className="nav-item">
                <a href="#" className="nav-link">
                  <p>Assets</p>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        <div className="app-content-header">
          <div className="container-fluid">
            <div className="row">
              <div className="col-sm-6">
                <h3 className="mb-0">Dashboard</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="app-content">
          <div className="container-fluid">
            {/* Info Card Example */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Welcome</h3>
              </div>
              <div className="card-body">
                AdminLTE 4 is successfully installed!
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
