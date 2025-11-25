import express from "express";
import { upload, uploadToAzure } from "../middleware/azureUpload.js";
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

// Analytics routes for Gift Shop Portal
router.get("/analytics/revenue/today", async (req, res) => {
  try {
    const db = (await import("../config/database.js")).default;

    const [results] = await db.query(`
      SELECT 
        COALESCE(SUM(pi.Unit_Price * pi.Quantity), 0) as todayRevenue,
        COALESCE(SUM(pi.Quantity), 0) as itemsSoldToday
      FROM purchase_item pi
      JOIN purchase p ON pi.Purchase_ID = p.Purchase_ID
      WHERE DATE(p.Purchase_Date) = CURDATE()
        AND pi.Item_ID != 9000
    `);

    res.json(results[0]);
  } catch (error) {
    console.error("Error fetching today's revenue:", error);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
});

router.get("/analytics/top-selling", async (req, res) => {
  try {
    const db = (await import("../config/database.js")).default;

    // Aggregate by Item_Name to persist sales across item deletions/re-additions
    // Join purchase_item with item table to get Item_Name, then aggregate
    const [results] = await db.query(`
      SELECT 
        i.Item_Name,
        MAX(i.Item_ID) as Item_ID,
        MAX(i.Price) as Price,
        MAX(i.Category) as Category,
        MAX(i.Image_URL) as Image_URL,
        COALESCE(SUM(pi.Quantity), 0) as totalSold
      FROM item i
      LEFT JOIN item i2 ON i.Item_Name = i2.Item_Name
      LEFT JOIN purchase_item pi ON i2.Item_ID = pi.Item_ID
      WHERE i.Item_ID != 9000
      GROUP BY i.Item_Name
      ORDER BY totalSold DESC
      LIMIT 3
    `);

    res.json(results);
  } catch (error) {
    console.error("Error fetching top selling items:", error);
    res.status(500).json({ error: "Failed to fetch top selling items" });
  }
});

router.get("/analytics/top-selling-today", async (req, res) => {
  try {
    const db = (await import("../config/database.js")).default;

    // Aggregate by Item_Name to persist sales across item deletions/re-additions
    const [results] = await db.query(`
      SELECT 
        i.Item_Name,
        SUM(pi.Quantity) as soldToday
      FROM purchase_item pi
      JOIN purchase p ON pi.Purchase_ID = p.Purchase_ID
      JOIN item i ON pi.Item_ID = i.Item_ID
      WHERE DATE(p.Purchase_Date) = CURDATE()
        AND pi.Item_ID != 9000
      GROUP BY i.Item_Name
      ORDER BY soldToday DESC
      LIMIT 1
    `);

    res.json(results[0] || { Item_Name: null, soldToday: 0 });
  } catch (error) {
    console.error("Error fetching top selling item today:", error);
    res.status(500).json({ error: "Failed to fetch top selling item" });
  }
});

// Get all purchases
router.get("/purchases", async (req, res) => {
  try {
    const db = (await import("../config/database.js")).default;
    const [purchases] = await db.query("SELECT * FROM purchase");
    res.json(purchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

// Get all purchase items
router.get("/purchase-items", async (req, res) => {
  try {
    const db = (await import("../config/database.js")).default;
    const [purchaseItems] = await db.query("SELECT * FROM purchase_item");
    res.json(purchaseItems);
  } catch (error) {
    console.error("Error fetching purchase items:", error);
    res.status(500).json({ error: "Failed to fetch purchase items" });
  }
});

// Image upload route for shop items
router.post(
  "/items/:id/upload-image",
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const db = (await import("../config/database.js")).default;

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Upload to Azure Blob Storage
      const imageUrl = await uploadToAzure(req.file, "items");

      // Update item in database with new image URL
      await db.query("UPDATE item SET Image_URL = ? WHERE Item_ID = ?", [
        imageUrl,
        id,
      ]);

      // Fetch updated item
      const [items] = await db.query("SELECT * FROM item WHERE Item_ID = ?", [
        id,
      ]);

      res.json(items[0]);
    } catch (error) {
      console.error("Error uploading item image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

export default router;
