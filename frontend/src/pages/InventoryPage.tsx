import React, { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import InventoryTable from "../components/inventory/InventoryTable";
import AssetFormModal from "../components/inventory/AssetFormModal";
// import api from '../services/api'; // Assuming you have this set up

const InventoryPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [assets, setAssets] = useState<any[]>([]); // Replace 'any' with your Interface

  // Mock Data Fetching
  useEffect(() => {
    // api.get('/inventory').then(res => setAssets(res.data));
    console.log("Fetching assets...");
  }, []);

  return (
    <div className="app-wrapper">
      <nav className="app-header navbar navbar-expand bg-body">
        <div className="container-fluid">
          <span className="navbar-brand">CIT Asset System</span>
        </div>
      </nav>

      <Sidebar activePage="inventory" />

      <main className="app-main">
        {/* Page Header */}
        <div className="app-content-header">
          <div className="container-fluid">
            <div className="row">
              <div className="col-sm-6">
                <h3 className="mb-0">Inventory Assets</h3>
              </div>
              <div className="col-sm-6 text-end">
                <button
                  className="btn btn-primary shadow-sm hover:shadow-md transition-all"
                  onClick={() => setShowModal(true)}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Add New Asset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="app-content">
          <div className="container-fluid">
            <div className="card card-outline card-primary">
              <div className="card-header">
                <h3 className="card-title">Asset List</h3>
              </div>
              <div className="card-body p-0">
                <InventoryTable assets={assets} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Overlay */}
      {showModal && (
        <AssetFormModal
          onClose={() => setShowModal(false)}
          onSave={(data) => console.log("Saving", data)}
        />
      )}
    </div>
  );
};

export default InventoryPage;
