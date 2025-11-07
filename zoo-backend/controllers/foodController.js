import pool from "../config/database.js";
import { uploadToAzure, deleteFromAzure } from "../middleware/azureUpload.js";

export const getConcessionStats = async (req, res) => {
  try {
    // Today's revenue and items sold
    const [todayStats] = await pool.query(
      `SELECT 
        COALESCE(SUM(pci.Quantity * pci.Unit_Price), 0) AS todayRevenue,
        COALESCE(SUM(pci.Quantity), 0) AS itemsSoldToday
      FROM Purchase_Concession_Item pci
      JOIN Purchase p ON pci.Purchase_ID = p.Purchase_ID
      WHERE DATE(p.Purchase_Date) = CURDATE()`
    );

    // All-time revenue
    const [allTimeStats] = await pool.query(
      `SELECT 
        COALESCE(SUM(pci.Quantity * pci.Unit_Price), 0) AS allTimeRevenue
      FROM Purchase_Concession_Item pci`
    );

    // Top-selling item today
    const [topItemStats] = await pool.query(
      `SELECT 
        ci.Item_Name, 
        COALESCE(SUM(pci.Quantity), 0) AS Quantity
      FROM Purchase_Concession_Item pci
      JOIN Concession_Item ci ON ci.Concession_Item_ID = pci.Concession_Item_ID
      JOIN Purchase p ON pci.Purchase_ID = p.Purchase_ID
      WHERE DATE(p.Purchase_Date) = CURDATE()
      GROUP BY ci.Item_Name
      ORDER BY Quantity DESC
      LIMIT 1`
    );

    const todayRevenue = parseFloat(todayStats[0]?.todayRevenue || 0);
    const itemsSoldToday = parseInt(todayStats[0]?.itemsSoldToday || 0);
    const allTimeRevenue = parseFloat(allTimeStats[0]?.allTimeRevenue || 0);
    
    const topItemToday = topItemStats.length > 0
      ? {
          Item_Name: topItemStats[0].Item_Name,
          Quantity: parseInt(topItemStats[0].Quantity || 0),
        }
      : null;

    res.json({
      todayRevenue,
      allTimeRevenue,
      itemsSoldToday,
      topItemToday,
    });
  } catch (error) {
    console.error("❌ Error fetching concession stats:", error);
    console.error("Error details:", error.message);
    if (error.sqlMessage) {
      console.error("SQL Error:", error.sqlMessage);
    }
    res.status(500).json({ error: "Failed to fetch concession statistics" });
  }
};

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

export const addFood = async (req, res) => {
  try {
    const { Stand_ID, Item_Name, Price } = req.body;

    if (!Stand_ID || !Item_Name || !Price) {
      return res
        .status(400)
        .json({ error: "Stand_ID, Item_Name, and Price are required" });
    }

    let imageUrl = null;
    if (req.file) {
      try {
        imageUrl = await uploadToAzure(req.file, "food");
      } catch (err) {
        console.error("Azure upload failed:", err);
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

export const updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { Item_Name, Price } = req.body;

    const [rows] = await pool.query(
      `SELECT Image_URL FROM concession_item WHERE Concession_Item_ID = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    let newImageUrl = rows[0].Image_URL;

    if (req.file) {
      if (newImageUrl) await deleteFromAzure(newImageUrl);
      newImageUrl = await uploadToAzure(req.file, "food");
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

export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT Image_URL FROM concession_item WHERE Concession_Item_ID = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    const imageUrl = rows[0].Image_URL;
    if (imageUrl) {
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
