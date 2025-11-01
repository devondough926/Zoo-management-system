import { BlobServiceClient } from "@azure/storage-blob";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { optimizeImage, validateImage } from "./imageOptimizer.js";

// ==========================
// Setup paths
// ==========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localUploadsDir = path.join(__dirname, "../uploads");

// Create /uploads if missing
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

// ==========================
// Azure Blob Initialization
// ==========================
let blobServiceClient = null;
let azureConfigError = null;

try {
  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
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
    console.warn("[INFO] Running in local upload mode (Azure disabled)");
  }
} catch (error) {
  azureConfigError = error.message;
  console.error("[ERROR] Failed to initialize Azure Blob Storage:", error);
}

// ==========================
// Multer configuration
// ==========================
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) cb(null, true);
  else cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
};

const multerUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

// ==========================
// Upload middleware
// ==========================
export const upload = {
  single: (fieldName) => {
    return async (req, res, next) => {
      multerUpload.single(fieldName)(req, res, async (err) => {
        if (err) {
          console.error("Multer error:", err);
          return res.status(400).json({ error: err.message });
        }

        if (!req.file) return next(); // no file uploaded

        try {
          const isValid = await validateImage(req.file.buffer);
          if (!isValid) {
            return res.status(400).json({
              error: "Invalid image file",
              details:
                "The uploaded file is not a valid image or dimensions are too large",
            });
          }

          // Optimize before storing
          const optimized = await optimizeImage(req.file.buffer, {
            maxWidth: 800,
            format: "webp",
            quality: 85,
          });

          req.file.buffer = optimized.buffer;
          req.file.mimetype = "image/webp";
          req.file.originalname = req.file.originalname.replace(
            /\.[^.]+$/,
            ".webp"
          );

          // ==========================
          // Azure upload
          // ==========================
          if (blobServiceClient) {
            const url = await uploadToAzure(req.file, "animals");
            req.file.url = url;
            return next();
          }

          // ==========================
          // Local fallback upload
          // ==========================
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const fileName = `${uniqueSuffix}-${req.file.originalname}`;
          const filePath = path.join(localUploadsDir, fileName);

          await fs.promises.writeFile(filePath, req.file.buffer);
          req.file.url = `/uploads/${fileName}`; // local relative path

          console.log("📁 Image saved locally:", filePath);
          next();
        } catch (error) {
          console.error("Error during image upload:", error);
          res.status(500).json({
            error: "Failed to process image upload",
            details: error.message,
          });
        }
      });
    };
  },
};

// ==========================
// Azure upload helper
// ==========================
export const uploadToAzure = async (file, folder = "animals") => {
  if (!blobServiceClient) throw new Error("Azure Blob Storage not configured");

  try {
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER_NAME
    );
    await containerClient.createIfNotExists();

    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const blobName = `${folder}/${folder}-${uniqueSuffix}${fileExtension}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(file.buffer, file.buffer.length, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log("☁️ Uploaded to Azure:", blockBlobClient.url);
    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading to Azure:", error);
    throw new Error(`Azure upload failed: ${error.message}`);
  }
};

// ==========================
// Azure delete helper
// ==========================
export const deleteFromAzure = async (imageUrl) => {
  if (!blobServiceClient || !imageUrl) return;

  try {
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER_NAME
    );

    let blobName;
    if (imageUrl.startsWith("http")) {
      const url = new URL(imageUrl);
      const parts = url.pathname.split("/");
      blobName = parts.slice(2).join("/");
    } else {
      blobName = imageUrl;
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    console.error("Error deleting from Azure:", error);
  }
};

// ==========================
// Azure configuration check
// ==========================
export const isAzureConfigured = () => !!blobServiceClient;
