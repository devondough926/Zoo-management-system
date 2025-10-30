import express from "express";
import { promisePool } from "../config/database.js";
const router = express.Router();

// Inventory list
router.get("/", async (_req, res) => {
  try {
    const [rows] = await promisePool.query("SELECT * FROM gifts");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create item
router.post("/", async (req, res) => {
  try {
    const { item_name, price, quantity_available } = req.body;
    const [r] = await promisePool.query(
      "INSERT INTO gifts (item_name, price, quantity_available) VALUES (?, ?, ?)",
      [item_name, price, quantity_available]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update item
router.put("/:id", async (req, res) => {
  try {
    const { item_name, price, quantity_available } = req.body;
    await promisePool.query(
      "UPDATE gifts SET item_name=?, price=?, quantity_available=? WHERE gift_id=?",
      [item_name, price, quantity_available, req.params.id]
    );
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete item
router.delete("/:id", async (req, res) => {
  try {
    await promisePool.query("DELETE FROM gifts WHERE gift_id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// (Optional) Record a sale — trigger will decrement stock
router.post("/:id/sell", async (req, res) => {
  try {
    const { quantity } = req.body;
    // Compute total by current price
    const [[item]] = await promisePool.query("SELECT price FROM gifts WHERE gift_id=?", [req.params.id]);
    if (!item) return res.status(404).json({ error: "Item not found" });
    const total = Number(item.price) * Number(quantity);

    await promisePool.query(
      "INSERT INTO gift_sales (gift_id, quantity_sold, total_price) VALUES (?, ?, ?)",
      [req.params.id, quantity, total]
    );
    res.status(201).json({ message: "Sale recorded" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
