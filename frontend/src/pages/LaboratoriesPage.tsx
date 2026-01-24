import { useEffect, useState } from "react";
import api from "../api/axios"; // Adjust path if needed
import Sidebar from "../components/layout/Sidebar"; // Reusing the sidebar

// Interface matches your MySQL 'laboratories' table
interface Laboratory {
  lab_id: number;
  lab_name: string;
  location: string;
}

const LaboratoriesPage = () => {
  const [labs, setLabs] = useState<Laboratory[]>([]);

  useEffect(() => {
    api
      .get("/laboratories")
      .then((res) => setLabs(res.data))
      .catch((err) => console.error("Error fetching labs:", err));
  }, []);

  return (
    <div className="app-wrapper">
      {/* Header */}
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
                <i className="bi bi-list"></i>
              </a>
            </li>
            <li className="nav-item d-none d-md-block">
              <span className="navbar-text">Laboratories Management</span>
            </li>
          </ul>
        </div>
      </nav>

      {/* Sidebar with 'labs' active */}
      <Sidebar active="labs" />

      <main className="app-main pt-4">
        <div className="app-content">
          <div className="container-fluid">
            <div className="card card-outline card-info">
              <div className="card-header">
                <h3 className="card-title">Registered Laboratories</h3>
              </div>
              <div className="card-body p-0">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th style={{ width: "10%" }}>ID</th>
                      <th>Lab Name</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labs.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center p-3">
                          No labs found.
                        </td>
                      </tr>
                    ) : (
                      labs.map((lab) => (
                        <tr key={lab.lab_id}>
                          <td>{lab.lab_id}</td>
                          <td className="fw-bold">{lab.lab_name}</td>
                          <td>{lab.location}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LaboratoriesPage;
