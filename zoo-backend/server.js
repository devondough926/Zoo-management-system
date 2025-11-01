import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { testConnection } from "./config/database.js";

// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";

import { isAzureConfigured } from "./middleware/azureUpload.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// Middleware
// ==========================
// Disable CSP for development to avoid blocking images
const isDevelopment = process.env.NODE_ENV !== "production";

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: isDevelopment
      ? false // Disable CSP in development
      : {
          useDefaults: true,
          directives: {
            "default-src": ["'self'"],
            // ✅ Allow images from Cloudinary, data URIs, and localhost
            "img-src": [
              "'self'",
              "data:",
              "blob:",
              "https://res.cloudinary.com",
              "http://localhost:*",
            ],
            "script-src": ["'self'", "'unsafe-inline'"],
            "connect-src": ["'self'", "*"],
          },
        },
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      // ✅ Allow localhost and any explicitly allowed origin
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS rejected origin:", origin);
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// Serve local image uploads (fallback when Azure isn't used)
// ==========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ This exposes the /uploads folder to the browser
app.use("/uploads", (req, res, next) => {
  // Set CORS headers for image requests
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "uploads")));

// ==========================
// Health Check
// ==========================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Zoo Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// ==========================
// Mount Routes
// ==========================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/food", foodRoutes); // ✅ Concession Stand Portal + Food Page

// ==========================
// 404 Handler
// ==========================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// ==========================
// Global Error Handler
// ==========================
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ==========================
// Start Server
// ==========================
const startServer = async () => {
  try {
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("⚠️  Server starting without database connection");
    }

    if (isAzureConfigured()) {
      console.log("✅ Azure Blob Storage is configured");
    } else {
      console.warn("⚠️  Azure Blob Storage is NOT configured - image uploads may fail");
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(
        `Images: ${
          isAzureConfigured()
            ? "Stored in Azure Blob Storage"
            : "Served locally from /uploads"
        }\n`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

