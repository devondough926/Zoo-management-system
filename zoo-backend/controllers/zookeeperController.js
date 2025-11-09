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
    const { logTypes, search, limit = 100, startDate, endDate } = req.query;

    let query = `
      SELECT 
        acl.Log_ID,
        acl.Animal_ID,
        acl.Employee_ID,
        DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Log_Date,
        acl.Activity,
        acl.Log_Type,
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
      WHERE 1=1
    `;

    const params = [];

    // Default: only include logs from the past 7 days unless a startDate is provided
    if (startDate) {
      query += ` AND acl.Log_Date >= ?`;
      params.push(startDate);
    } else {
      query += ` AND acl.Log_Date >= (NOW() - INTERVAL 7 DAY)`;
    }

    if (endDate) {
      query += ` AND acl.Log_Date <= ?`;
      params.push(endDate);
    }

    // Filter by log types if provided
    if (logTypes) {
      const types = logTypes.split(",");
      const placeholders = types.map(() => "?").join(",");
      query += ` AND acl.Log_Type IN (${placeholders})`;
      params.push(...types);
    }

    // Search in activity, animal name, or enclosure name
    if (search) {
      query += ` AND (acl.Activity LIKE ? OR a.Animal_Name LIKE ? OR enc.Enclosure_Name LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY acl.Log_Date DESC LIMIT ?`;
    params.push(parseInt(limit));

    const [logs] = await db.query(query, params);

    res.json(logs);
  } catch (error) {
    console.error("Error fetching care logs:", error);
    res.status(500).json({ error: "Failed to fetch care logs" });
  }
};

export const createCareLog = async (req, res) => {
  try {
    const { animalId, employeeId, activity, notes, logDate, logType } =
      req.body;

    // Validate required fields
    if (!animalId || !employeeId || !activity) {
      return res
        .status(400)
        .json({ error: "Animal ID, Employee ID, and Activity are required" });
    }

    const logDateValue = logDate || new Date();
    const logTypeValue = logType || "update";

    const [result] = await db.query(
      `INSERT INTO Animal_Care_Log (Animal_ID, Employee_ID, Log_Date, Activity, Log_Type, Notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        animalId,
        employeeId,
        logDateValue,
        activity,
        logTypeValue,
        notes || null,
      ]
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
        `UPDATE Feeding_Schedule SET ${updates.join(
          ", "
        )} WHERE Feeding_ID = ?`,
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

// ============================================
// FEEDING TASKS (needs_feeding VIEW logic)
// ============================================

export const getFeedingTasks = async (req, res) => {
  try {
    // Get all animals with their enclosure and location info
    const [animals] = await db.query(`
      SELECT 
        a.Animal_ID,
        a.Animal_Name,
        a.Species,
        a.Feeding_Frequency_Type,
        a.Meals as Meals_Per_Day,
        a.Image_URL,
        e.Enclosure_Name,
        e.Enclosure_ID,
        l.Zone
      FROM Animal a
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      ORDER BY a.Animal_Name
    `);

    // Get today's feeding logs
    const [feedingLogs] = await db.query(`
      SELECT 
        acl.Animal_ID,
        DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Fed_Time,
        acl.Employee_ID,
        acl.Notes
      FROM Animal_Care_Log acl
      WHERE acl.Log_Type = 'fed'
      ORDER BY acl.Log_Date DESC
    `);

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Build feeding tasks with status
    const feedingTasks = animals.map((animal) => {
      const animalLogs = feedingLogs.filter(
        (log) => log.Animal_ID === animal.Animal_ID
      );
      const lastFeedingLog = animalLogs[0];
      const lastFeedingTime = lastFeedingLog?.Fed_Time;

      const isWeeklyFeeder = animal.Feeding_Frequency_Type === "Weekly";
      const mealsPerDay = animal.Meals_Per_Day || (isWeeklyFeeder ? 1 : 2);

      let fedToday = 0;
      let stillNeeds = 0;
      let status = "unfed";
      let daysUntilNextFeeding = undefined;

      if (isWeeklyFeeder) {
        // Weekly feeding logic
        if (lastFeedingTime) {
          const lastFed = new Date(lastFeedingTime);
          const daysSinceLastFed = Math.floor(
            (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysRemaining = 7 - daysSinceLastFed;

          if (daysSinceLastFed < 7) {
            fedToday = 1;
            stillNeeds = 0;
            status = "complete";
            daysUntilNextFeeding = Math.max(0, daysRemaining);
          } else {
            fedToday = 0;
            stillNeeds = 1;
            status = "unfed";
            daysUntilNextFeeding = 0;
          }
        } else {
          fedToday = 0;
          stillNeeds = 1;
          status = "unfed";
          daysUntilNextFeeding = 0;
        }
      } else {
        // Daily feeding logic
        const todayLogs = animalLogs.filter((log) => {
          const logDate = log.Fed_Time.split(" ")[0];
          return logDate === today;
        });
        fedToday = todayLogs.length;
        stillNeeds = Math.max(0, mealsPerDay - fedToday);

        if (fedToday >= mealsPerDay) status = "complete";
        else if (fedToday > 0) status = "partial";
        else status = "unfed";
      }

      return {
        Animal_ID: animal.Animal_ID,
        Animal_Name: animal.Animal_Name,
        Species: animal.Species,
        Enclosure_Name: animal.Enclosure_Name,
        Zone: animal.Zone || "Unknown",
        Meals_Per_Day: mealsPerDay,
        Fed_Today: fedToday,
        Still_Needs: stillNeeds,
        Status: status,
        Last_Fed_Time: lastFeedingTime,
        Image_URL: animal.Image_URL,
        Feeding_Frequency_Type: animal.Feeding_Frequency_Type,
        Days_Until_Next_Feeding: daysUntilNextFeeding,
      };
    });

    res.json(feedingTasks);
  } catch (error) {
    console.error("Error fetching feeding tasks:", error);
    res.status(500).json({ error: "Failed to fetch feeding tasks" });
  }
};

// ============================================
// CLEANING SCHEDULES
// ============================================

export const getCleaningSchedules = async (req, res) => {
  try {
    const [enclosures] = await db.query(`
      SELECT 
        e.Enclosure_ID,
        e.Enclosure_Name,
        e.Size,
        l.Zone
      FROM Enclosure e
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      ORDER BY e.Enclosure_Name
    `);

    // Get last cleaning for each enclosure
    const [cleaningLogs] = await db.query(`
      SELECT 
        a.Enclosure_ID,
        MAX(acl.Log_Date) as Last_Cleaned
      FROM Animal_Care_Log acl
      JOIN Animal a ON acl.Animal_ID = a.Animal_ID
      WHERE acl.Log_Type = 'maintenance' 
        AND acl.Activity LIKE '%clean%'
      GROUP BY a.Enclosure_ID
    `);

    const now = new Date();

    const cleaningSchedules = enclosures.map((enclosure) => {
      const cleaningLog = cleaningLogs.find(
        (log) => log.Enclosure_ID === enclosure.Enclosure_ID
      );

      let lastCleaned = null;
      let nextCleaningDue = null;
      let daysRemaining = 7;
      let progress = 0;
      let isCleaned = false;

      if (cleaningLog && cleaningLog.Last_Cleaned) {
        lastCleaned = new Date(cleaningLog.Last_Cleaned);
        nextCleaningDue = new Date(
          lastCleaned.getTime() + 7 * 24 * 60 * 60 * 1000
        );

        const timeRemaining = nextCleaningDue.getTime() - now.getTime();
        daysRemaining = Math.max(
          0,
          Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
        );
        progress = Math.max(0, Math.min(100, ((7 - daysRemaining) / 7) * 100));
        isCleaned = daysRemaining > 5;
      }

      return {
        Enclosure_ID: enclosure.Enclosure_ID,
        Enclosure_Name: enclosure.Enclosure_Name,
        Zone: enclosure.Zone || "Unknown",
        Size: enclosure.Size,
        Is_Cleaned: isCleaned,
        Last_Cleaned: lastCleaned ? lastCleaned.toISOString() : null,
        Next_Cleaning_Due: nextCleaningDue
          ? nextCleaningDue.toISOString()
          : null,
        Days_Remaining: daysRemaining,
        Progress: progress,
      };
    });

    res.json(cleaningSchedules);
  } catch (error) {
    console.error("Error fetching cleaning schedules:", error);
    res.status(500).json({ error: "Failed to fetch cleaning schedules" });
  }
};

// ============================================
// NOTIFICATIONS (new animals & cleaning due)
// ============================================

export const getNotifications = async (req, res) => {
  try {
    const notifications = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get new animals from past 7 days
    const [newAnimals] = await db.query(
      `
      SELECT 
        acl.Log_ID,
        acl.Animal_ID,
        acl.Log_Date,
        acl.Activity,
        acl.Notes,
        a.Animal_Name,
        a.Species,
        e.Enclosure_Name
      FROM Animal_Care_Log acl
      JOIN Animal a ON acl.Animal_ID = a.Animal_ID
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
      WHERE acl.Log_Type = 'new' 
        AND acl.Log_Date >= ?
      ORDER BY acl.Log_Date DESC
    `,
      [sevenDaysAgo.toISOString().split("T")[0]]
    );

    newAnimals.forEach((animal) => {
      notifications.push({
        id: `new-animal-${animal.Log_ID}`,
        type: "new_animal",
        message: `New animal added: ${animal.Animal_Name}`,
        timestamp: animal.Log_Date,
        animal_id: animal.Animal_ID,
        details: `${animal.Species} added to ${animal.Enclosure_Name}`,
      });
    });

    // Get cleaning schedules for overdue enclosures
    const [enclosures] = await db.query(`
      SELECT 
        e.Enclosure_ID,
        e.Enclosure_Name,
        l.Zone,
        MAX(acl.Log_Date) as Last_Cleaned
      FROM Enclosure e
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      LEFT JOIN Animal a ON e.Enclosure_ID = a.Enclosure_ID
      LEFT JOIN Animal_Care_Log acl ON a.Animal_ID = acl.Animal_ID 
        AND acl.Log_Type = 'maintenance' 
        AND acl.Activity LIKE '%clean%'
      GROUP BY e.Enclosure_ID, e.Enclosure_Name, l.Zone
    `);

    enclosures.forEach((enclosure) => {
      if (enclosure.Last_Cleaned) {
        const lastCleaned = new Date(enclosure.Last_Cleaned);
        const nextDue = new Date(
          lastCleaned.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        const daysRemaining = Math.ceil(
          (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining <= 0) {
          notifications.push({
            id: `cleaning-due-${enclosure.Enclosure_ID}`,
            type: "cleaning_due",
            message: `${enclosure.Enclosure_Name} cleaning is now due`,
            timestamp: nextDue.toISOString(),
            enclosure_id: enclosure.Enclosure_ID,
            details: `7-day cleaning cycle completed for Zone ${enclosure.Zone}`,
          });
        }
      }
    });

    // Sort by timestamp (newest first)
    notifications.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// ============================================
// CLEANING CARD DATA (from cleaning_card_data VIEW)
// ============================================

export const getCleaningCardData = async (req, res) => {
  try {
    const [cleaningData] = await db.query(`
      SELECT 
        Enclosure_ID,
        Enclosure_Name,
        Size,
        last_cleaned,
        Zone,
        skip_days,
        days_passed,
        days_remaining,
        next_due,
        progress_percent,
        status
      FROM cleaning_card_data
      ORDER BY Zone ASC, Enclosure_Name ASC
    `);

    res.json(cleaningData);
  } catch (error) {
    console.error("Error fetching cleaning card data:", error);
    res.status(500).json({ error: "Failed to fetch cleaning card data" });
  }
};

// ============================================
// MARK HABITAT AS CLEANED
// ============================================

export const markHabitatCleaned = async (req, res) => {
  try {
    const { enclosureId } = req.params;
    const { employeeId, notes } = req.body;

    // Update enclosure last_cleaned to full datetime (use NOW()) so time is preserved
    await db.query(
      `UPDATE Enclosure 
       SET last_cleaned = NOW(), Is_Cleaned = 1 
       WHERE Enclosure_ID = ?`,
      [enclosureId]
    );

    // Get animals in this enclosure for logging
    const [animals] = await db.query(
      `SELECT Animal_ID FROM Animal WHERE Enclosure_ID = ?`,
      [enclosureId]
    );

    // Log the cleaning activity for each animal in the enclosure
    if (animals.length > 0) {
      const animalId = animals[0].Animal_ID; // Use first animal for the log
      // Insert care log using application-side Date to match createCareLog behavior
      // This ensures the stored Log_Date matches other logs created via API (including timezone handling)
      const logDateValue = new Date();
      await db.query(
        `INSERT INTO Animal_Care_Log (Animal_ID, Employee_ID, Log_Date, Activity, Log_Type, Notes)
         VALUES (?, ?, ?, 'Habitat cleaned', 'maintenance', ?)`,
        [
          animalId,
          employeeId || null,
          logDateValue,
          notes || "7-day habitat cleaning completed",
        ]
      );
    }

    // Remove any skip days for this enclosure
    await db.query(`DELETE FROM enclosure_skip_days WHERE Enclosure_ID = ?`, [
      enclosureId,
    ]);

    res.json({
      message: "Habitat marked as cleaned successfully",
      enclosureId: enclosureId,
    });
  } catch (error) {
    console.error("Error marking habitat as cleaned:", error);
    res.status(500).json({ error: "Failed to mark habitat as cleaned" });
  }
};

// ============================================
// CANCEL CLEANING (Skip Days)
// ============================================

export const cancelCleaning = async (req, res) => {
  try {
    const { enclosureId } = req.params;
    const { skipDays = 1 } = req.body;

    // Check if skip_days entry exists
    const [existing] = await db.query(
      `SELECT * FROM enclosure_skip_days WHERE Enclosure_ID = ?`,
      [enclosureId]
    );

    if (existing.length > 0) {
      // Update existing skip days
      await db.query(
        `UPDATE enclosure_skip_days 
         SET skip_days = skip_days + ? 
         WHERE Enclosure_ID = ?`,
        [skipDays, enclosureId]
      );
    } else {
      // Insert new skip days record
      await db.query(
        `INSERT INTO enclosure_skip_days (Enclosure_ID, skip_days) 
         VALUES (?, ?)`,
        [enclosureId, skipDays]
      );
    }

    res.json({
      message: "Cleaning postponed successfully",
      enclosureId: enclosureId,
      skipDays: skipDays,
    });
  } catch (error) {
    console.error("Error cancelling cleaning:", error);
    res.status(500).json({ error: "Failed to cancel cleaning" });
  }
};
