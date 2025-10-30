import express from "express";
import {
  getAllFood,
  getFoodById,
  addFood,
  updateFood,
  deleteFood,
} from "../controllers/foodController.js";

const router = express.Router();

// Food routes
router.get("/", getAllFood);
router.get("/:id", getFoodById);
router.post("/", addFood);
router.put("/:id", updateFood);
router.delete("/:id", deleteFood);

export default router;
