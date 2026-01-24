import { useState, useEffect } from "react";
import api from "../api/axios"; // Ensure you have your axios helper
import Sidebar from "../components/layout/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import "admin-lte/dist/css/adminlte.min.css";
import "admin-lte/dist/js/adminlte.min.js";

interface Asset {
  asset_id: number;
  property_tag_no: string;
  item_name: string;
  description: string;
  serial_number: string;
  quantity: number;
  laboratories?: { lab_name: string };
  units?: { unit_name: string };
  date_of_purchase: string;
}

const InventoryPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get("/inventory");
      setAssets(res.data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

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
                <i className="bi bi-list"></i> Menu
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <Sidebar active="inventory" />

      <main className="app-main pt-4">
        <div className="app-content">
          <div className="container-fluid">
            <div className="card card-outline card-primary">
              <div className="card-header">
                <h3 className="card-title">Inventory Assets</h3>
                <div className="card-tools">
                  <button className="btn btn-primary btn-sm">
                    <i className="bi bi-plus-lg"></i> Add Asset
                  </button>
                </div>
              </div>

              <div className="card-body p-0 table-responsive">
                <table className="table table-striped table-hover text-nowrap">
                  <thead>
                    <tr>
                      <th>Property Tag</th>
                      <th>Item Name</th>
                      <th>Description</th>
                      <th>Serial No.</th>
                      <th>Location</th>
                      <th>Unit Type</th>
                      <th>Qty</th>
                      <th>Purchase Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center">
                          No assets found.
                        </td>
                      </tr>
                    ) : (
                      assets.map((asset) => (
                        <tr key={asset.asset_id}>
                          <td className="fw-bold text-primary">
                            {asset.property_tag_no}
                          </td>
                          <td>{asset.item_name}</td>
                          <td>{asset.description}</td>
                          <td>{asset.serial_number}</td>
                          <td>
                            <span className="badge text-bg-info">
                              {asset.laboratories?.lab_name || "N/A"}
                            </span>
                          </td>
                          <td>{asset.units?.unit_name || "N/A"}</td>
                          <td>{asset.quantity}</td>
                          <td>
                            {new Date(
                              asset.date_of_purchase,
                            ).toLocaleDateString()}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-warning me-1">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-danger">
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
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

export default InventoryPage;
