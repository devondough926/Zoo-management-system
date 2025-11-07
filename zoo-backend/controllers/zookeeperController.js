import db from "../config/database.js";

// ============================================
// ZOOKEEPER DASHBOARD STATS
// ============================================

export const getZookeeperStats = async (req, res) => {
  try {
    // Get total animals
    const [totalAnimals] = await db.query(
      "SELECT COUNT(*) as count FROM Animal"
    );

    // Get total enclosures
    const [totalEnclosures] = await db.query(
      "SELECT COUNT(*) as count FROM Enclosure"
    );

    // Get animals fed today (from animal_care_log)
    const [animalsFedToday] = await db.query(
      `SELECT COUNT(DISTINCT Animal_ID) as count 
       FROM Animal_Care_Log 
       WHERE DATE(Log_Date) = CURDATE() 
       AND Activity LIKE '%feed%'`
    );

    // Get care logs count for today
    const [careLogsToday] = await db.query(
      `SELECT COUNT(*) as count 
       FROM Animal_Care_Log 
       WHERE DATE(Log_Date) = CURDATE()`
    );

    res.json({
      totalAnimals: totalAnimals[0].count,
      totalEnclosures: totalEnclosures[0].count,
      animalsFedToday: animalsFedToday[0].count,
      careLogsToday: careLogsToday[0].count,
    });
  } catch (error) {
    console.error("Error fetching zookeeper stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

// ============================================
// ANIMALS BY ENCLOSURE
// ============================================

export const getAnimalsByEnclosure = async (req, res) => {
  try {
    const { enclosureId } = req.params;

    const [animals] = await db.query(
      `SELECT 
        a.Animal_ID,
        a.Animal_Name,
        a.Species,
        a.Gender,
        a.Weight,
        DATE_FORMAT(a.Birthday, '%Y-%m-%d') as Birthday,
        a.Health_Status,
        a.Is_Vaccinated,
        a.Enclosure_ID,
        a.Image_URL,
        e.Enclosure_Name,
        e.Enclosure_Type,
        TIMESTAMPDIFF(YEAR, a.Birthday, CURDATE()) as Age
      FROM Animal a
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
      WHERE a.Enclosure_ID = ?
      ORDER BY a.Animal_Name`,
      [enclosureId]
    );

    res.json(animals);
  } catch (error) {
    console.error("Error fetching animals by enclosure:", error);
    res.status(500).json({ error: "Failed to fetch animals" });
  }
};

// ============================================
// ANIMAL CARE LOGS
// ============================================

export const getAnimalCareLogs = async (req, res) => {
  try {
    const { animalId } = req.params;

    const [logs] = await db.query(
      `SELECT 
        acl.Log_ID,
        acl.Animal_ID,
        acl.Employee_ID,
        DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Log_Date,
        acl.Activity,
        acl.Notes,
        e.First_Name,
        e.Last_Name,
        a.Animal_Name,
        a.Species
      FROM Animal_Care_Log acl
      LEFT JOIN Employee e ON acl.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON acl.Animal_ID = a.Animal_ID
      WHERE acl.Animal_ID = ?
      ORDER BY acl.Log_Date DESC`,
      [animalId]
    );

    res.json(logs);
  } catch (error) {
    console.error("Error fetching care logs:", error);
    res.status(500).json({ error: "Failed to fetch care logs" });
  }
};

export const getAllCareLogs = async (req, res) => {
  try {
    const [logs] = await db.query(
      `SELECT 
        acl.Log_ID,
        acl.Animal_ID,
        acl.Employee_ID,
        DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Log_Date,
        acl.Activity,
        acl.Notes,
        e.First_Name,
        e.Last_Name,
        a.Animal_Name,
        a.Species,
        enc.Enclosure_Name
      FROM Animal_Care_Log acl
      LEFT JOIN Employee e ON acl.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON acl.Animal_ID = a.Animal_ID
      LEFT JOIN Enclosure enc ON a.Enclosure_ID = enc.Enclosure_ID
      ORDER BY acl.Log_Date DESC
      LIMIT 100`
    );

    res.json(logs);
  } catch (error) {
    console.error("Error fetching care logs:", error);
    res.status(500).json({ error: "Failed to fetch care logs" });
  }
};

export const createCareLog = async (req, res) => {
  try {
    const { animalId, employeeId, activity, notes, logDate } = req.body;

    // Validate required fields
    if (!animalId || !employeeId || !activity) {
      return res
        .status(400)
        .json({ error: "Animal ID, Employee ID, and Activity are required" });
    }

    const logDateValue = logDate || new Date();

    const [result] = await db.query(
      `INSERT INTO Animal_Care_Log (Animal_ID, Employee_ID, Log_Date, Activity, Notes)
       VALUES (?, ?, ?, ?, ?)`,
      [animalId, employeeId, logDateValue, activity, notes || null]
    );

    // Fetch the newly created log
    const [newLog] = await db.query(
      `SELECT 
        acl.Log_ID,
        acl.Animal_ID,
        acl.Employee_ID,
        DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Log_Date,
        acl.Activity,
        acl.Notes,
        e.First_Name,
        e.Last_Name,
        a.Animal_Name,
        a.Species
      FROM Animal_Care_Log acl
      LEFT JOIN Employee e ON acl.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON acl.Animal_ID = a.Animal_ID
      WHERE acl.Log_ID = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Care log created successfully",
      log: newLog[0],
    });
  } catch (error) {
    console.error("Error creating care log:", error);
    res.status(500).json({ error: "Failed to create care log" });
  }
};

// ============================================
// FEEDING SCHEDULE
// ============================================

export const getFeedingSchedule = async (req, res) => {
  try {
    const { date } = req.query;

    let query = `
      SELECT 
        fs.Feeding_ID,
        fs.Animal_ID,
        fs.Food,
        DATE_FORMAT(fs.Feeding_Time, '%Y-%m-%d %H:%i:%s') as Feeding_Time,
        a.Animal_Name,
        a.Species,
        e.Enclosure_Name,
        e.Enclosure_ID
      FROM Feeding_Schedule fs
      LEFT JOIN Animal a ON fs.Animal_ID = a.Animal_ID
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
    `;

    const params = [];

    if (date) {
      query += " WHERE DATE(fs.Feeding_Time) = DATE(?)";
      params.push(date);
    }

    query += " ORDER BY fs.Feeding_Time";

    const [schedule] = await db.query(query, params);

    res.json(schedule);
  } catch (error) {
    console.error("Error fetching feeding schedule:", error);
    res.status(500).json({ error: "Failed to fetch feeding schedule" });
  }
};

export const getFeedingScheduleByEnclosure = async (req, res) => {
  try {
    const { enclosureId } = req.params;
    const { date } = req.query;

    let query = `
      SELECT 
        fs.Feeding_ID,
        fs.Animal_ID,
        fs.Food,
        DATE_FORMAT(fs.Feeding_Time, '%Y-%m-%d %H:%i:%s') as Feeding_Time,
        a.Animal_Name,
        a.Species,
        e.Enclosure_Name,
        e.Enclosure_ID
      FROM Feeding_Schedule fs
      LEFT JOIN Animal a ON fs.Animal_ID = a.Animal_ID
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
      WHERE e.Enclosure_ID = ?
    `;

    const params = [enclosureId];

    if (date) {
      query += " AND DATE(fs.Feeding_Time) = DATE(?)";
      params.push(date);
    }

    query += " ORDER BY fs.Feeding_Time";

    const [schedule] = await db.query(query, params);

    res.json(schedule);
  } catch (error) {
    console.error("Error fetching feeding schedule by enclosure:", error);
    res.status(500).json({ error: "Failed to fetch feeding schedule" });
  }
};

export const createFeedingSchedule = async (req, res) => {
  try {
    const { animalId, food, feedingTime } = req.body;

    // Validate required fields
    if (!animalId || !food || !feedingTime) {
      return res
        .status(400)
        .json({ error: "Animal ID, Food, and Feeding Time are required" });
    }

    const [result] = await db.query(
      `INSERT INTO Feeding_Schedule (Animal_ID, Food, Feeding_Time)
       VALUES (?, ?, ?)`,
      [animalId, food, feedingTime]
    );

    // Fetch the newly created schedule
    const [newSchedule] = await db.query(
      `SELECT 
        fs.Feeding_ID,
        fs.Animal_ID,
        fs.Food,
        DATE_FORMAT(fs.Feeding_Time, '%Y-%m-%d %H:%i:%s') as Feeding_Time,
        a.Animal_Name,
        a.Species,
        e.Enclosure_Name,
        e.Enclosure_ID
      FROM Feeding_Schedule fs
      LEFT JOIN Animal a ON fs.Animal_ID = a.Animal_ID
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
      WHERE fs.Feeding_ID = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Feeding schedule created successfully",
      schedule: newSchedule[0],
    });
  } catch (error) {
    console.error("Error creating feeding schedule:", error);
    res.status(500).json({ error: "Failed to create feeding schedule" });
  }
};

export const updateFeedingSchedule = async (req, res) => {
  try {
    const { feedingId } = req.params;
    const { food, feedingTime } = req.body;

    // Build dynamic UPDATE query with only provided fields
    const updates = [];
    const values = [];

    if (food !== undefined) {
      updates.push("Food = ?");
      values.push(food);
    }
    if (feedingTime !== undefined) {
      updates.push("Feeding_Time = ?");
      values.push(feedingTime);
    }

    // Only update if there are fields to update
    if (updates.length > 0) {
      values.push(feedingId);
      await db.query(
        `UPDATE Feeding_Schedule SET ${updates.join(", ")} WHERE Feeding_ID = ?`,
        values
      );
    }

    // Fetch updated schedule
    const [updatedSchedule] = await db.query(
      `SELECT 
        fs.Feeding_ID,
        fs.Animal_ID,
        fs.Food,
        DATE_FORMAT(fs.Feeding_Time, '%Y-%m-%d %H:%i:%s') as Feeding_Time,
        a.Animal_Name,
        a.Species,
        e.Enclosure_Name,
        e.Enclosure_ID
      FROM Feeding_Schedule fs
      LEFT JOIN Animal a ON fs.Animal_ID = a.Animal_ID
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
      WHERE fs.Feeding_ID = ?`,
      [feedingId]
    );

    res.json({
      message: "Feeding schedule updated successfully",
      schedule: updatedSchedule[0],
    });
  } catch (error) {
    console.error("Error updating feeding schedule:", error);
    res.status(500).json({ error: "Failed to update feeding schedule" });
  }
};

export const deleteFeedingSchedule = async (req, res) => {
  try {
    const { feedingId } = req.params;

    await db.query("DELETE FROM Feeding_Schedule WHERE Feeding_ID = ?", [
      feedingId,
    ]);

    res.json({ message: "Feeding schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting feeding schedule:", error);
    res.status(500).json({ error: "Failed to delete feeding schedule" });
  }
};

// ============================================
// GET ALL ENCLOSURES
// ============================================

export const getAllEnclosures = async (req, res) => {
  try {
    const [enclosures] = await db.query(`
      SELECT 
        e.Enclosure_ID,
        e.Enclosure_Name,
        e.Location_ID,
        e.Size,
        e.Enclosure_Type,
        l.Zone,
        l.Location_Description,
        COUNT(a.Animal_ID) as Animal_Count
      FROM Enclosure e
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      LEFT JOIN Animal a ON e.Enclosure_ID = a.Enclosure_ID
      GROUP BY e.Enclosure_ID, e.Enclosure_Name, e.Location_ID, e.Size, e.Enclosure_Type, l.Zone, l.Location_Description
      ORDER BY e.Enclosure_Name
    `);
    res.json(enclosures);
  } catch (error) {
    console.error("Error fetching enclosures:", error);
    res.status(500).json({ error: "Failed to fetch enclosures" });
  }
};

// ============================================
// ENCLOSURE STATUS (for habitat cleaning tracking)
// ============================================

export const getEnclosureStatus = async (req, res) => {
  try {
    const { enclosureId } = req.params;

    // Get last cleaning log for this enclosure
    const [logs] = await db.query(
      `SELECT 
        acl.Log_ID,
        DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Log_Date,
        acl.Activity,
        acl.Notes,
        e.First_Name,
        e.Last_Name
      FROM Animal_Care_Log acl
      LEFT JOIN Employee e ON acl.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON acl.Animal_ID = a.Animal_ID
      WHERE a.Enclosure_ID = ? 
      AND (acl.Activity LIKE '%clean%' OR acl.Activity LIKE '%maintenance%')
      ORDER BY acl.Log_Date DESC
      LIMIT 1`,
      [enclosureId]
    );

    res.json({
      lastCleaning: logs.length > 0 ? logs[0] : null,
    });
  } catch (error) {
    console.error("Error fetching enclosure status:", error);
    res.status(500).json({ error: "Failed to fetch enclosure status" });
  }
};