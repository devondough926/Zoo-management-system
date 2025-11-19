import db from "../config/database.js";

// Activate a weather condition by Weather_ID or Condition_Type
export const setActiveWeather = async (req, res) => {
  try {
    const { id, type } = req.body;

    if (!id && !type) {
      return res.status(400).json({ error: "Missing weather id or type" });
    }

    // If id provided, set that row active; otherwise match by type
    if (id) {
      // Use a single UPDATE to set Is_Active true for the selected and false for others
      await db.query(
        `UPDATE weather_conditions SET Is_Active = (Weather_ID = ?);`,
        [id]
      );
    } else {
      await db.query(
        `UPDATE weather_conditions SET Is_Active = (Condition_Type = ?);`,
        [type]
      );
    }

    // Return updated list
    const [rows] = await db.query(
      `SELECT Weather_ID, Condition_Type, Is_Active FROM weather_conditions ORDER BY Weather_ID`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error setting active weather:", error);
    res.status(500).json({ error: "Failed to set active weather" });
  }
};

export const clearWeather = async (req, res) => {
  try {
    await db.query(`UPDATE weather_conditions SET Is_Active = 0;`);
    const [rows] = await db.query(
      `SELECT Weather_ID, Condition_Type, Is_Active FROM weather_conditions ORDER BY Weather_ID`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error clearing weather:", error);
    res.status(500).json({ error: "Failed to clear weather" });
  }
};

// Get the currently active weather condition (if any)
export const getActiveWeather = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT Weather_ID, Condition_Type, Is_Active FROM weather_conditions WHERE Is_Active = 1 ORDER BY Weather_ID`
    );

    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error("Error fetching active weather:", error);
    res.status(500).json({ error: "Failed to fetch active weather" });
  }
};
