import express from "express";
import {
  getAllFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
} from "../controllers/foodController.js";

const router = express.Router();

// GET all food items
router.get("/", getAllFoodItems);

// POST create food item
router.post("/", createFoodItem);

// PUT update food item
router.put("/:id", updateFoodItem);

// DELETE food item
router.delete("/:id", deleteFoodItem);

export default router;

