import express from "express";
import {
  getAllShopItems,
  getShopItemById,
  addShopItem,
  updateShopItem,
  deleteShopItem,
  updateShopItemStock,
} from "../controllers/shopController.js";

const router = express.Router();

// Public routes (customers can view)
router.get("/items", getAllShopItems);
router.get("/items/:id", getShopItemById);

// Admin routes (staff can manage)
router.post("/items", addShopItem);
router.put("/items/:id", updateShopItem);
router.delete("/items/:id", deleteShopItem);
router.patch("/items/:id/stock", updateShopItemStock);

export default router;