import { useState, useEffect } from "react";
import api from "../api/axios";
import Sidebar from "../components/layout/Sidebar";
import AddAssetModal from "../components/inventory/AddAssetModal";
import { useAuth } from "../context/AuthContext";
import CreateUserModal from "../components/CreateUserModal";
import AddWorkstationModal from "../components/inventory/AddWorkstationModal";
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
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showWSModal, setShowWSModal] = useState(false);

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
          </ul>
          <ul className="navbar-nav ms-auto">
            <li className="nav-item d-flex align-items-center gap-3">
              <span className="fw-bold">Hello, {user?.name}</span>
              <button
                onClick={logout}
                className="btn btn-sm btn-outline-danger"
              >
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
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

                {/* --- CORRECT BUTTON LOCATION: CARD TOOLS --- */}
                <div className="card-tools">
                  {(user?.role === "Admin" || user?.role === "Custodian") && (
                    <button
                      className="btn btn-primary btn-sm me-2"
                      onClick={() => setShowModal(true)}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Add Asset
                    </button>
                  )}
                  <button
                    className="btn btn-outline-dark btn-sm me-2"
                    onClick={() => setShowWSModal(true)}
                  >
                    <i className="bi bi-pc-display me-1"></i> New Workstation
                  </button>

                  {/* 2. CREATE USER: Visible ONLY to Admin */}
                  {user?.role === "Admin" && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => setShowUserModal(true)}
                    >
                      <i className="bi bi-person-plus-fill me-1"></i> Create
                      User
                    </button>
                  )}
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
                      {/* Optional: Actions column for Edit/Delete */}
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
                            {/* Actions per row (Edit/Delete only) */}
                            <button className="btn btn-sm btn-warning me-1">
                              <i className="bi bi-pencil"></i>
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

      {/* --- MODALS LIVE OUTSIDE THE LOOP --- */}
      <AddAssetModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchInventory}
      />

      <CreateUserModal
        show={showUserModal}
        onClose={() => setShowUserModal(false)}
      />
      <AddWorkstationModal
        show={showWSModal}
        onClose={() => setShowWSModal(false)}
        onSuccess={() => {
          /* Optional: Refresh something if needed */
        }}
      />
    </div>
  );
};

export default InventoryPage;
