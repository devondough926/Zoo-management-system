import db from "../config/database.js";

// Get all shop items
export const getAllShopItems = async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT * FROM Item 
      WHERE Item_ID != 9000
      ORDER BY Item_Name
    `);
    res.json(items);
  } catch (error) {
    console.error("Error fetching shop items:", error);
    res.status(500).json({ error: "Failed to fetch shop items" });
  }
};

// Get item by ID
export const getShopItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const [items] = await db.query(
      "SELECT * FROM Item WHERE Item_ID = ?",
      [id]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json(items[0]);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
};

// Add new item
export const addShopItem = async (req, res) => {
  try {
    const { Item_Name, Price, Category, Shop_ID = 1 } = req.body;
    
    const [result] = await db.query(
      "INSERT INTO Item (Item_Name, Price, Category, Shop_ID) VALUES (?, ?, ?, ?)",
      [Item_Name, Price, Category, Shop_ID]
    );
    
    const [newItem] = await db.query(
      "SELECT * FROM Item WHERE Item_ID = ?",
      [result.insertId]
    );
    
    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
};

// Update item
export const updateShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { Item_Name, Price, Category } = req.body;
    
    await db.query(
      "UPDATE Item SET Item_Name = ?, Price = ?, Category = ? WHERE Item_ID = ?",
      [Item_Name, Price, Category, id]
    );
    
    const [updatedItem] = await db.query(
      "SELECT * FROM Item WHERE Item_ID = ?",
      [id]
    );
    
    res.json(updatedItem[0]);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

// Delete item
export const deleteShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query("DELETE FROM Item WHERE Item_ID = ?", [id]);
    
    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
};

// Update stock
export const updateShopItemStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    await db.query("UPDATE Item SET Stock = ? WHERE Item_ID = ?", [stock, id]);
    
    res.json({ success: true, message: "Stock updated successfully" });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ error: "Failed to update stock" });
  }
};