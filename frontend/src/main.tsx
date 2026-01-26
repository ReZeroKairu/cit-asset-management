import "bootstrap/dist/css/bootstrap.min.css"; // 1. Import Bootstrap CSS
import "admin-lte/dist/css/adminlte.min.css"; // 2. Import AdminLTE CSS
import "admin-lte/dist/js/adminlte.min.js"; // 3. Import AdminLTE JS (Controls the sidebar, overlay, etc)

// 4. (Optional) Import Bootstrap Icons or FontAwesome if you need them
// For now, let's stick to the basics.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext"; // Import this

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
