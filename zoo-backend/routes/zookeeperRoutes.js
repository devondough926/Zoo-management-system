import express from "express";
import { promisePool } from "../config/database.js";
const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await promisePool.query("SELECT * FROM zookeepers");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM zookeepers WHERE keeper_id=?",
      [req.params.id]
    );
    rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { name, shift, phone, email, assigned_area, active = 1 } = req.body;
    const [r] = await promisePool.query(
      "INSERT INTO zookeepers (name, shift, phone, email, assigned_area, active) VALUES (?, ?, ?, ?, ?, ?)",
      [name, shift, phone, email, assigned_area, active]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, shift, phone, email, assigned_area, active } = req.body;
    await promisePool.query(
      "UPDATE zookeepers SET name=?, shift=?, phone=?, email=?, assigned_area=?, active=? WHERE keeper_id=?",
      [name, shift, phone, email, assigned_area, active, req.params.id]
    );
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await promisePool.query("DELETE FROM zookeepers WHERE keeper_id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
