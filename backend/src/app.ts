// backend/src/app.ts
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { auditMiddleware } from "./middleware/audit";

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
import complaintsRoutes from "./routes/complaintsRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import auditRoutes from "./routes/auditRoutes";

const app = express();

// Security: Restrict CORS
const isDevelopment = process.env.NODE_ENV !== "production";
app.use(
  cors({
    origin: isDevelopment
      ? [
          /^http:\/\/localhost:\d+$/,
          /^http:\/\/127\.0\.0\.1:\d+$/,
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
          "http://192.168.56.1:5173",
          "http://192.168.56.1:5174",
          "http://192.168.56.1:3000",
          "http://192.168.56.1:3001",
          "http://192.168.111.21:5173",
          "http://192.168.111.21:5174",
          "http://192.168.111.21:3000",
          "http://192.168.111.21:3001",
          "http://172.72.102.4:5173",
          "http://172.72.102.4:5174",
          "http://172.72.102.4:3000",
          "http://172.72.102.4:3001",
        ]
      : [
          "http://192.168.56.1:5173",
          "http://192.168.56.1:5174",
          "http://192.168.56.1:3000",
          "http://192.168.56.1:3001",
          "http://192.168.111.21:5173",
          "http://192.168.111.21:5174",
          "http://192.168.111.21:3000",
          "http://192.168.111.21:3001",
          "http://172.72.102.4:5173",
          "http://172.72.102.4:5174",
          "http://172.72.102.4:3000",
          "http://172.72.102.4:3001",
        ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json());

// Trust proxy to get real client IP addresses
app.set("trust proxy", true);

// Rate limiting for public forms
const publicFormsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 6,
  message: {
    error: "Form submission limit reached. Please try again in an hour.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: (req) => req.method !== "POST",
});

// Mount Routes
app.use("/", authRoutes);
app.use("/users", userRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/workstations", workstationRoutes);
app.use("/laboratories", labRoutes);
app.use("/daily-reports", reportRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/forms", formsRoutes);
app.use("/public-forms", publicFormsLimiter, publicFormsRoutes);
app.use("/public-complaints", publicFormsLimiter, complaintsRoutes);
app.use("/complaints", complaintsRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/audit", auditRoutes);
app.use("/maintenance", maintenanceRoutes);

// Test endpoint with audit middleware
app.post(
  "/audit-middleware-test",
  auditMiddleware("TEST", "ENDPOINT"),
  async (req, res) => {
    res.json({ success: true, message: "Audit middleware test successful!" });
  },
);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("🚨 Global error handler caught:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message || "Unknown error",
  });
});

export default app;
