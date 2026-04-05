import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Load environment variables
dotenv.config();

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes
import authRoutes from "./routes/auth.js";
import snapsRoutes from "./routes/snaps.js";
import storageRoutes from "./routes/storage.js";
import tagsRoutes from "./routes/tags.js";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow ALL origins, no restrictions
app.use(cors({ origin: true, credentials: true }));
app.options("*", cors({ origin: true, credentials: true }));

// Security middleware (after CORS so error responses still have CORS headers)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Specific parser for the storage upload route to handle large base64 screenshots securely
app.use("/api/storage/upload", express.json({ limit: "25mb" }));

// Parse JSON bodies for everything else with a safe limit
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/snaps", snapsRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/tags", tagsRoutes);

// Root route handler
app.get("/", (req, res) => {
  res.status(200).json({
    message: "ScrollNote API Server",
    status: "running",
    endpoints: [
      "/api/auth - Authentication endpoints",
      "/api/snaps - Screenshot management endpoints",
      "/api/storage - Storage management endpoints",
      "/api/tags - Tag management endpoints",
    ],
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
