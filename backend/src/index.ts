// backend/src/index.ts
import express from "express";
import cors from "cors";
import { config } from "./config";

// Import Routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import workstationRoutes from "./routes/workstationRoutes";
import labRoutes from "./routes/labRoutes";
import reportRoutes from "./routes/reportRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import maintenanceRoutes from "./routes/maintenanceRoutes";

const app = express();

// Security: Restrict CORS to your frontend
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);

app.use(express.json());

// Mount Routes
app.use("/", authRoutes);
app.use("/users", userRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/workstations", workstationRoutes);
app.use("/laboratories", labRoutes);
app.use("/daily-reports", reportRoutes);
app.use("/dashboard", dashboardRoutes);

// ✅ FIXED: Changed from "/maintenance-reports" to "/maintenance" to match frontend API
app.use("/maintenance", maintenanceRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
