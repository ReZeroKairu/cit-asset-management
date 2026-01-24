import { useState } from "react";

// Import Global Styles
import "bootstrap/dist/css/bootstrap.min.css";
import "admin-lte/dist/css/adminlte.min.css";
import "admin-lte/dist/js/adminlte.min.js";

// Import your Pages
import InventoryPage from "./pages/InventoryPage";
import LaboratoriesPage from "./pages/LaboratoriesPage";

function App() {
  // Simple state to switch pages (Temporary until we add React Router)
  const [currentPage, setCurrentPage] = useState<"inventory" | "labs">(
    "inventory",
  );

  return (
    <>
      {/* This is a temporary "Page Switcher" 
         In a real app, we would use <Routes> here.
      */}
      {currentPage === "inventory" && <InventoryPage />}
      {currentPage === "labs" && <LaboratoriesPage />}

      {/* Debug Menu: Remove this later 
         (Just helps you switch back and forth for now)
      */}
      <div style={{ position: "fixed", bottom: 10, right: 10, zIndex: 9999 }}>
        <button
          className="btn btn-secondary btn-sm me-2"
          onClick={() => setCurrentPage("labs")}
        >
          View Labs Test
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setCurrentPage("inventory")}
        >
          View Inventory App
        </button>
      </div>
    </>
  );
}

export default App;
