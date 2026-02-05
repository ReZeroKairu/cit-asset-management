// backend/src/index.ts
import express from "express";
import cors from "cors";
import { config } from "./config"; // Ensure you created src/config.ts as discussed!

// Import Routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import workstationRoutes from "./routes/workstationRoutes";
import labRoutes from "./routes/labRoutes";
import reportRoutes from "./routes/reportRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

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
app.use("/", authRoutes); // handles /login
app.use("/users", userRoutes); // handles /users/*
app.use("/inventory", inventoryRoutes); // handles /inventory/*, /units, /device-types
app.use("/workstations", workstationRoutes);
app.use("/laboratories", labRoutes);
app.use("/daily-reports", reportRoutes); // handles reports and procedures
app.use("/dashboard", dashboardRoutes);

// 404 Handler (Optional but good practice)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
