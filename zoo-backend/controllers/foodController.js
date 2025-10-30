import db from "../config/database.js";

// ============================================
// FOOD - Concession Stand
// ============================================

// Get all food items
export const getAllFood = async (req, res) => {
  try {
    const [foods] = await db.query(`
      SELECT 
        food_id,
        item_name,
        price,
        quantity_available
      FROM food
      ORDER BY item_name
    `);
    res.json(foods);
  } catch (error) {
    console.error("Error fetching food:", error);
    res.status(500).json({ error: "Failed to fetch food items" });
  }
};

// Get a single food item
export const getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const [foods] = await db.query("SELECT * FROM food WHERE food_id = ?", [id]);
    if (foods.length === 0) return res.status(404).json({ error: "Food not found" });
    res.json(foods[0]);
  } catch (error) {
    console.error("Error fetching food by ID:", error);
    res.status(500).json({ error: "Failed to fetch food item" });
  }
};

// Add a new food item
export const addFood = async (req, res) => {
  try {
    const { item_name, price, quantity_available } = req.body;
    const [result] = await db.query(
      "INSERT INTO food (item_name, price, quantity_available) VALUES (?, ?, ?)",
      [item_name, price, quantity_available]
    );
    res.status(201).json({ message: "Food added successfully", id: result.insertId });
  } catch (error) {
    console.error("Error adding food:", error);
    res.status(500).json({ error: "Failed to add food" });
  }
};

// Update a food item
export const updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, price, quantity_available } = req.body;
    await db.query(
      "UPDATE food SET item_name=?, price=?, quantity_available=? WHERE food_id=?",
      [item_name, price, quantity_available, id]
    );
    res.json({ message: "Food updated successfully" });
  } catch (error) {
    console.error("Error updating food:", error);
    res.status(500).json({ error: "Failed to update food" });
  }
};

// Delete a food item
export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM food WHERE food_id=?", [id]);
    res.json({ message: "Food deleted successfully" });
  } catch (error) {
    console.error("Error deleting food:", error);
    res.status(500).json({ error: "Failed to delete food" });
  }
};

