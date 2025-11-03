import pool from "../config/database.js";
import { uploadToAzure, deleteFromAzure } from "../middleware/azureUpload.js";

// ✅ Get all food items
export const getAllFood = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ci.Concession_Item_ID, 
        ci.Stand_ID, 
        ci.Item_Name, 
        ci.Price, 
        ci.Image_URL,
        cs.Stand_Name
      FROM concession_item ci
      JOIN concession_stand cs ON ci.Stand_ID = cs.Stand_ID
      ORDER BY cs.Stand_Name, ci.Item_Name ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching food items:", error);
    res.status(500).json({ error: "Failed to fetch food items" });
  }
};

// ✅ Add new food item (with guaranteed Azure persistence)
export const addFood = async (req, res) => {
  try {
    const { Stand_ID, Item_Name, Price } = req.body;
    console.log("📥 Add Food Request:", { Stand_ID, Item_Name, Price });
    console.log("📸 File received:", req.file ? req.file.originalname : "None");

    if (!Stand_ID || !Item_Name || !Price) {
      return res
        .status(400)
        .json({ error: "Stand_ID, Item_Name, and Price are required" });
    }

    let imageUrl = null;
    if (req.file) {
      try {
        console.log("🪣 Uploading to Azure...");
        imageUrl = await uploadToAzure(req.file, "food");
        console.log("✅ Uploaded to Azure:", imageUrl);
      } catch (err) {
        console.error("❌ Azure upload failed:", err);
        return res
          .status(500)
          .json({ error: "Azure upload failed", details: err.message });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO concession_item (Stand_ID, Item_Name, Price, Image_URL)
       VALUES (?, ?, ?, ?)`,
      [Stand_ID, Item_Name, Price, imageUrl]
    );

    console.log("✅ Inserted into MySQL:", result.insertId, imageUrl);

    // Fetch and return the newly created item with all fields
    const [newItemRows] = await pool.query(
      `SELECT 
        ci.Concession_Item_ID, 
        ci.Stand_ID, 
        ci.Item_Name, 
        ci.Price, 
        ci.Image_URL,
        cs.Stand_Name
      FROM concession_item ci
      JOIN concession_stand cs ON ci.Stand_ID = cs.Stand_ID
      WHERE ci.Concession_Item_ID = ?`,
      [result.insertId]
    );

    res.status(201).json(newItemRows[0] || {
      message: "Item added successfully",
      Concession_Item_ID: result.insertId,
      Image_URL: imageUrl,
    });
  } catch (error) {
    console.error("❌ Error adding food:", error);
    res.status(500).json({ error: "Failed to add food item" });
  }
};

// ✅ Update existing food item (replace Azure image if new uploaded)
export const updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { Item_Name, Price } = req.body;
    console.log("✏️ Update Item:", { id, Item_Name, Price });

    const [rows] = await pool.query(
      `SELECT Image_URL FROM concession_item WHERE Concession_Item_ID = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    let newImageUrl = rows[0].Image_URL;

    if (req.file) {
      console.log("🔄 Replacing image in Azure...");
      if (newImageUrl) await deleteFromAzure(newImageUrl);
      newImageUrl = await uploadToAzure(req.file, "food");
      console.log("✅ New Azure URL:", newImageUrl);
    }

    await pool.query(
      `UPDATE concession_item SET Item_Name=?, Price=?, Image_URL=? WHERE Concession_Item_ID=?`,
      [Item_Name, Price, newImageUrl, id]
    );

    // Fetch and return the updated item
    const [updatedRows] = await pool.query(
      `SELECT 
        ci.Concession_Item_ID, 
        ci.Stand_ID, 
        ci.Item_Name, 
        ci.Price, 
        ci.Image_URL,
        cs.Stand_Name
      FROM concession_item ci
      JOIN concession_stand cs ON ci.Stand_ID = cs.Stand_ID
      WHERE ci.Concession_Item_ID = ?`,
      [id]
    );

    res.json(updatedRows[0] || { message: "Item updated successfully", Image_URL: newImageUrl });
  } catch (error) {
    console.error("❌ Error updating food:", error);
    res.status(500).json({ error: "Failed to update food item" });
  }
};

// ✅ Delete food item (and remove Azure image)
export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting item:", id);

    const [rows] = await pool.query(
      `SELECT Image_URL FROM concession_item WHERE Concession_Item_ID = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    const imageUrl = rows[0].Image_URL;
    if (imageUrl) {
      console.log("🪣 Removing from Azure:", imageUrl);
      await deleteFromAzure(imageUrl);
    }

    await pool.query(
      `DELETE FROM concession_item WHERE Concession_Item_ID = ?`,
      [id]
    );

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting food:", error);
    res.status(500).json({ error: "Failed to delete food item" });
  }
};
