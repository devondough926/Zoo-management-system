import { BlobServiceClient } from "@azure/storage-blob";
import multer from "multer";
import path from "path";
import { optimizeImage, validateImage } from "./imageOptimizer.js";

// Initialize Azure Blob Service
let blobServiceClient;
let azureConfigError = null;

try {
  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
    console.log("Initializing Azure Blob Storage...");

    if (!process.env.AZURE_STORAGE_CONTAINER_NAME) {
      azureConfigError =
        "AZURE_STORAGE_CONTAINER_NAME not found in environment variables";
      console.error("[ERROR] Azure Blob Storage Error:", azureConfigError);
    } else {
      blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
      console.log(
        `[SUCCESS] Azure Blob Storage initialized (Container: ${process.env.AZURE_STORAGE_CONTAINER_NAME})`
      );
    }
  } else {
    azureConfigError =
      "AZURE_STORAGE_CONNECTION_STRING not found in environment variables";
    console.error("[ERROR] Azure Blob Storage Error:", azureConfigError);
  }
} catch (error) {
  azureConfigError = error.message;
  console.error("[ERROR] Failed to initialize Azure Blob Storage:", error);
}

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

// File filter - only accept images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Create multer upload instance
const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size (we'll optimize it down)
  },
  fileFilter: fileFilter,
});

// Middleware to handle Azure upload after multer processes the file
export const upload = {
  single: (fieldName) => {
    return async (req, res, next) => {
      // First, run multer to process the file
      multerUpload.single(fieldName)(req, res, async (err) => {
        if (err) {
          console.error("Multer error:", err);
          return res.status(400).json({ error: err.message });
        }

        // If no file was uploaded, continue
        if (!req.file) {
          return next();
        }

        // Check if Azure is configured
        if (!blobServiceClient) {
          const errorMsg =
            azureConfigError || "Azure Blob Storage not configured";
          console.error("[ERROR] Azure Error:", errorMsg);
          return res.status(500).json({
            error: "Image upload service is not configured",
            details:
              "Azure Blob Storage is required for image uploads. Please contact the administrator.",
            technicalDetails: azureConfigError,
          });
        }

        try {
          // Validate image
          const isValid = await validateImage(req.file.buffer);
          if (!isValid) {
            return res.status(400).json({
              error: "Invalid image file",
              details:
                "The uploaded file is not a valid image or dimensions are too large",
            });
          }

          // Determine folder and image type
          const isAnimal = req.path.includes("animal");
          const folder = isAnimal ? "animals" : "exhibits";
          const imageType = isAnimal ? "animal" : "exhibit";

          // Optimize image before uploading
          const maxWidth = imageType === "animal" ? 800 : 1200;
          const optimized = await optimizeImage(req.file.buffer, {
            maxWidth,
            format: "webp",
            quality: 85,
          });

          // Update file buffer with optimized version
          req.file.buffer = optimized.buffer;
          req.file.mimetype = "image/webp";
          req.file.originalname = req.file.originalname.replace(
            /\.[^.]+$/,
            ".webp"
          );

          // Upload to Azure and get the URL
          const imageUrl = await uploadToAzure(req.file, folder);

          // Attach the URL and optimization info to req.file
          req.file.url = imageUrl;
          req.file.optimization = {
            originalSize: optimized.originalSize,
            optimizedSize: optimized.optimizedSize,
            compressionRatio: optimized.compressionRatio,
          };

          next();
        } catch (error) {
          console.error("Error uploading to Azure:", error);
          console.error("Error stack:", error.stack);
          res.status(500).json({
            error: "Failed to upload image to Azure Blob Storage",
            details: error.message,
          });
        }
      });
    };
  },
};

// Upload file to Azure Blob Storage
export const uploadToAzure = async (file, folder = "animals") => {
  if (!blobServiceClient) {
    throw new Error("Azure Blob Storage not configured");
  }

  try {
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER_NAME
    );

    // Ensure container exists
    await containerClient.createIfNotExists();

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = `${folder}/${folder}-${uniqueSuffix}${fileExtension}`;

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    // Upload the file
    await blockBlobClient.upload(file.buffer, file.buffer.length, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
        blobCacheControl: "public, max-age=31536000, immutable", // 1 year cache, immutable
        // Do NOT set content-encoding - the images are already optimized, not compressed
      },
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });

    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading to Azure:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    });
    throw new Error(
      `Failed to upload image to Azure Blob Storage: ${error.message}`
    );
  }
};

// Delete file from Azure Blob Storage
export const deleteFromAzure = async (imageUrl) => {
  if (!blobServiceClient || !imageUrl) {
    return;
  }

  try {
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER_NAME
    );

    // Extract blob name from URL
    // Handle both full Azure URLs and simple blob names
    let blobName;
    if (imageUrl.startsWith("http")) {
      // Extract the path after the container name
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split("/");
      // Remove empty string and container name, join the rest
      blobName = pathParts.slice(2).join("/");
    } else {
      // Already just the blob name
      blobName = imageUrl;
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    console.error("Error deleting from Azure:", error);
    // Don't throw error, just log it
  }
};

// Check if Azure is configured
export const isAzureConfigured = () => {
  return !!blobServiceClient;
};
