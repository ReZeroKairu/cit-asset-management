import { useEffect, useState } from "react";
import api from "./api/axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "admin-lte/dist/css/adminlte.min.css";
import "admin-lte/dist/js/adminlte.min.js";

// Define the shape of your data (matches your SQL)
interface Laboratory {
  lab_id: number;
  lab_name: string;
  location: string;
}

function App() {
  const [labs, setLabs] = useState<Laboratory[]>([]);

  useEffect(() => {
    // Fetch data from your new API
    api
      .get("/laboratories")
      .then((res) => setLabs(res.data))
      .catch((err) => console.error("Error fetching labs:", err));
  }, []);

  return (
    <div className="app-wrapper">
      <nav className="app-header navbar navbar-expand bg-body">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">CIT Asset System</span>
        </div>
      </nav>

      <main className="app-main pt-4">
        <div className="app-content">
          <div className="container-fluid">
            {/* LABS TABLE CARD */}
            <div className="card mb-4">
              <div className="card-header">
                <h3 className="card-title">Registered Laboratories</h3>
              </div>
              <div className="card-body p-0">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Lab Name</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labs.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center">
                          No labs found. Add some in MySQL!
                        </td>
                      </tr>
                    ) : (
                      labs.map((lab) => (
                        <tr key={lab.lab_id}>
                          <td>{lab.lab_id}</td>
                          <td>{lab.lab_name}</td>
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
}

export default App;
