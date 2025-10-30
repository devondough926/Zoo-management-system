import express from "express";
import { promisePool } from "../config/database.js";
const router = express.Router();

// GET all vets
router.get("/", async (_req, res) => {
  try {
    const [rows] = await promisePool.query("SELECT * FROM veterinarians");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET one vet
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM veterinarians WHERE vet_id=?",
      [req.params.id]
    );
    rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const { name, specialty, phone, email, hired_date, active = 1 } = req.body;
    const [r] = await promisePool.query(
      "INSERT INTO veterinarians (name, specialty, phone, email, hired_date, active) VALUES (?, ?, ?, ?, ?, ?)",
      [name, specialty, phone, email, hired_date, active]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { name, specialty, phone, email, hired_date, active } = req.body;
    await promisePool.query(
      "UPDATE veterinarians SET name=?, specialty=?, phone=?, email=?, hired_date=?, active=? WHERE vet_id=?",
      [name, specialty, phone, email, hired_date, active, req.params.id]
    );
    res.json({ message: "Updated" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await promisePool.query("DELETE FROM veterinarians WHERE vet_id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
