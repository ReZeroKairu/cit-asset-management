// backend/src/index.ts
import express from "express";
import cors from "cors";
import os from "os";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
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
import complaintsRoutes from "./routes/complaintsRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import auditRoutes from "./routes/auditRoutesSimple";

const app = express();
const prisma = new PrismaClient();

// Security: Restrict CORS to your frontend and network IP
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://192.168.56.1:5173',
      'http://192.168.56.1:5174',
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

// Trust proxy to get real client IP addresses
app.set('trust proxy', true);

// Rate limiting for public forms (reasonable limits)
const publicFormsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 6, // Allow 6 submissions per IP per hour
  message: {
    error: 'Too many form submissions. Please try again in an hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Skip rate limiting during development
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Development mode: Rate limiting disabled for public forms');
} else {
  console.log('🛡️ Production mode: Rate limiting active (10 submissions/hour per IP)');
}

// General rate limiting for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mount Routes
app.use("/", authRoutes);
app.use("/users", userRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/workstations", workstationRoutes);
app.use("/laboratories", labRoutes);
app.use("/daily-reports", reportRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/forms", formsRoutes); // handles forms submissions
app.use("/public-forms", publicFormsLimiter, publicFormsRoutes); // handles public form submissions (no auth)
app.use("/api/one-time-forms", publicFormsLimiter, oneTimeFormsRoutes); // handles one-time QR form tokens
app.use("/public-complaints", publicFormsLimiter, complaintsRoutes); // handles public complaint submissions (no auth)
app.use("/complaints", complaintsRoutes); // handles complaint management (auth required)
app.use("/analytics", analyticsRoutes); // handles analytics endpoints (admin only)
app.use("/audit", auditRoutes); // handles audit logs (admin only)

// Simple audit test route - bypass all complexity
app.get("/audit-test", async (req, res) => {
  try {
    console.log('🔍 Direct audit test route hit!');
    
    // Direct database query
    const result = await prisma.$queryRawUnsafe(`
      SELECT id, user_id, action, description, created_at 
      FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT 5
    `) as any[];
    
    console.log('📊 Direct query result:', result);
    
    res.json({ 
      success: true, 
      logs: result,
      count: result.length,
      message: 'Direct query successful!' 
    });
  } catch (error) {
    console.error('❌ Direct query error:', error);
    res.status(500).json({ 
      error: 'Direct query failed', 
      details: (error as Error).message 
    });
  }
});

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

const getLanIpv4Address = (): string | null => {
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    const addrs = nets[name] || [];
    for (const addr of addrs) {
      if (addr && addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }

  return null;
};

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${config.port}`);
  const lanIp = getLanIpv4Address();
  if (lanIp) {
    console.log(`Server also accessible on network: http://${lanIp}:${config.port}`);
  }
});
