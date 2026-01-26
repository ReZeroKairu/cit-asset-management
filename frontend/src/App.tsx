import { useState } from "react";
import { useAuth } from "./context/AuthContext"; // Import Auth Hook
import LoginPage from "./pages/LoginPage";
import InventoryPage from "./pages/InventoryPage";
import LaboratoriesPage from "./pages/LaboratoriesPage";
import "bootstrap/dist/css/bootstrap.min.css";
import "admin-lte/dist/css/adminlte.min.css";
import "admin-lte/dist/js/adminlte.min.js";

function App() {
  const { user } = useAuth(); // Check if user is logged in
  const [currentPage, setCurrentPage] = useState<"inventory" | "labs">(
    "inventory",
  );

  // 1. IF NOT LOGGED IN -> SHOW LOGIN PAGE
  if (!user) {
    return <LoginPage />;
  }

  // 2. IF LOGGED IN -> SHOW MAIN APP
  return (
    <>
      {currentPage === "inventory" && <InventoryPage />}
      {currentPage === "labs" && <LaboratoriesPage />}

      {/* Navigation Switcher (Replace with real sidebar links later) */}
      <div style={{ position: "fixed", bottom: 10, right: 10, zIndex: 9999 }}>
        <button
          className="btn btn-secondary btn-sm me-2"
          onClick={() => setCurrentPage("labs")}
        >
          Labs
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setCurrentPage("inventory")}
        >
          Inventory
        </button>
      </div>
    </>
  );
}

export default App;
