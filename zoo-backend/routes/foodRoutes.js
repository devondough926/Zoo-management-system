import express from "express";
import {
  getAllFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
} from "../controllers/foodController.js";

// ✅ Import upload middleware
import {
  upload as azureUpload,
  isAzureConfigured,
} from "../middleware/azureUpload.js";
import { upload as localUpload } from "../middleware/upload.js";

const router = express.Router();

// ✅ Automatically use Azure upload if configured, else local uploads
const useUpload = isAzureConfigured()
  ? azureUpload.single("image")
  : localUpload.single("image");

// ==========================
// Routes
// ==========================

// 🍔 GET all food items
router.get("/", getAllFoodItems);

// ➕ POST create new food item (with optional image)
router.post("/", useUpload, createFoodItem);

// ✏️ PUT update food item
router.put("/:id", updateFoodItem);

// ❌ DELETE food item
router.delete("/:id", deleteFoodItem);

export default router;
