import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { testConnection } from "./config/database.js";
import adminRoutes from "./routes/adminRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import { isAzureConfigured } from "./middleware/azureUpload.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(null, false);
    },
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Zoo Management API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("[WARNING] Server starting without database connection");
    }

    if (isAzureConfigured()) {
      console.log("[SUCCESS] Azure Blob Storage is configured");
    } else {
      console.error(
        "[WARNING] Azure Blob Storage is NOT configured - image uploads will fail"
      );
    }

    app.listen(PORT, () => {
      console.log(`\n[SERVER] Running on port ${PORT}`);
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