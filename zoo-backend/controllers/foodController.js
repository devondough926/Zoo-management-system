import db from "../config/database.js";
import { isAzureConfigured } from "../middleware/azureUpload.js";

// ==========================
// 🍔 Get All Concession Items (with Stand Info)
// ==========================
export const getAllFoodItems = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ci.Concession_Item_ID,
        ci.Item_Name,
        ci.Price,
        ci.Image_URL,
        cs.Stand_ID,
        cs.Stand_Name,
        cs.Stand_Type,
        cs.Location_ID
      FROM Concession_Item ci
      LEFT JOIN Concession_Stand cs 
        ON ci.Stand_ID = cs.Stand_ID
      ORDER BY cs.Stand_Name, ci.Item_Name;
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error fetching concession items:", error);
    res.status(500).json({ error: "Failed to fetch food items" });
  }
};

// ==========================
// 🏪 Get Food Items by Stand ID
// ==========================
export const getFoodItemsByStand = async (req, res) => {
  const { standId } = req.params;
  try {
    const [rows] = await db.query(
      `
      SELECT 
        Concession_Item_ID,
        Item_Name,
        Price,
        Image_URL
      FROM Concession_Item
      WHERE Stand_ID = ?
      ORDER BY Item_Name;
    `,
      [standId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error fetching food items by stand:", error);
    res.status(500).json({ error: "Failed to fetch food items for this stand" });
  }
};

// ==========================
// ➕ Add New Food Item (with optional image upload)
// ==========================
export const createFoodItem = async (req, res) => {
  try {
    const { Stand_ID, Item_Name, Price } = req.body;

    if (!Stand_ID || !Item_Name || !Price) {
      return res
        .status(400)
        .json({ error: "Stand_ID, Item_Name, and Price are required" });
    }

    // Determine image URL source
    let imageUrl = null;

    if (req.file) {
      // From upload middleware (Azure or local)
      imageUrl =
        req.file.url ||
        (req.file.filename ? `/uploads/${req.file.filename}` : null);
    } else if (req.body.Image_URL) {
      // From frontend JSON body
      imageUrl = req.body.Image_URL;
    }

    const [result] = await db.query(
      `
      INSERT INTO Concession_Item (Stand_ID, Item_Name, Price, Image_URL)
      VALUES (?, ?, ?, ?);
    `,
      [Stand_ID, Item_Name, Price, imageUrl]
    );

    res.status(201).json({
      message: "Food item created successfully",
      newItemId: result.insertId,
      imageUrl,
      storage: isAzureConfigured() ? "azure" : "local",
    });
  } catch (error) {
    console.error("❌ Error creating food item:", error);
    res.status(500).json({ error: "Failed to create food item" });
  }
};

// ==========================
// ✏️ Update Food Item
// ==========================
export const updateFoodItem = async (req, res) => {
  const { id } = req.params;
  const { Item_Name, Price, Image_URL } = req.body;

  if (!Item_Name && !Price && !Image_URL) {
    return res.status(400).json({ error: "No fields provided to update" });
  }

  try {
    const [result] = await db.query(
      `
      UPDATE Concession_Item
      SET 
        Item_Name = COALESCE(?, Item_Name),
        Price = COALESCE(?, Price),
        Image_URL = COALESCE(?, Image_URL)
      WHERE Concession_Item_ID = ?;
    `,
      [Item_Name, Price, Image_URL, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Food item not found" });
    }

    res.json({ message: "Food item updated successfully" });
  } catch (error) {
    console.error("❌ Error updating food item:", error);
    res.status(500).json({ error: "Failed to update food item" });
  }
};

// ==========================
// ❌ Delete Food Item
// ==========================
export const deleteFoodItem = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      "DELETE FROM Concession_Item WHERE Concession_Item_ID = ?;",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Food item not found" });
    }

    res.json({ message: "Food item deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting food item:", error);
    res.status(500).json({ error: "Failed to delete food item" });
  }
};
