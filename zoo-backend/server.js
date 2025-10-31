import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";

// ✅ Import only the routes you actually need
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
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin images
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow localhost during dev
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
// Mount Routes (only relevant ones)
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
        `Images: Stored in Azure Blob Storage (${
          process.env.AZURE_STORAGE_CONTAINER_NAME || "not configured"
        })\n`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
