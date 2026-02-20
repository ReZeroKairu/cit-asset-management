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
import formsRoutes from "./routes/formsRoutes";
import publicFormsRoutes from "./routes/publicFormsRoutes";
import oneTimeFormsRoutes from "./routes/oneTimeFormsFinal";

const app = express();

// Security: Restrict CORS to your frontend and network IP
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://192.168.110.72:5173',
      'http://192.168.110.72:5174',
      'http://172.72.100.78:5173',
      'http://172.72.100.78:5174'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
app.use("/forms", formsRoutes); // handles forms submissions
app.use("/public-forms", publicFormsRoutes); // handles public form submissions (no auth)
app.use("/api/one-time-forms", oneTimeFormsRoutes); // handles one-time QR form tokens

// ✅ FIXED: Changed from "/maintenance-reports" to "/maintenance" to match frontend API
app.use("/maintenance", maintenanceRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('🚨 Global error handler caught:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message || 'Unknown error'
  });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Server also accessible on network: http://192.168.110.72:${config.port}`);
});
