import db from "../config/database.js";

// ============================================
// VETERINARIAN DASHBOARD STATS
// ============================================

export const getVeterinarianStats = async (req, res) => {
  try {
    // Get total animals
    const [totalAnimals] = await db.query(
      "SELECT COUNT(*) as count FROM Animal"
    );

    // Get vaccinated animals
    const [vaccinatedAnimals] = await db.query(
      "SELECT COUNT(*) as count FROM Animal WHERE Is_Vaccinated = 1"
    );

    // Get healthy animals (Excellent or Good health status)
    const [healthyAnimals] = await db.query(
      `SELECT COUNT(*) as count FROM Animal 
       WHERE Health_Status IN ('Excellent', 'Good')`
    );

    res.json({
      totalAnimals: totalAnimals[0].count,
      vaccinatedAnimals: vaccinatedAnimals[0].count,
      healthyAnimals: healthyAnimals[0].count,
    });
  } catch (error) {
    console.error("Error fetching veterinarian stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

// ============================================
// ALL ANIMALS (with enclosure details)
// ============================================

export const getAllAnimals = async (req, res) => {
  try {
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
        e.exhibit_Name as Enclosure_Name,
        e.Enclosure_Type,
        l.Zone,
        TIMESTAMPDIFF(YEAR, a.Birthday, CURDATE()) as Age
      FROM Animal a
      LEFT JOIN exhibit e ON a.Enclosure_ID = e.Exhibit_ID
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      ORDER BY a.Animal_Name`
    );

    res.json(animals);
  } catch (error) {
    console.error("Error fetching animals:", error);
    res.status(500).json({ error: "Failed to fetch animals" });
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
        e.exhibit_Name,
        e.Enclosure_Type,
        TIMESTAMPDIFF(YEAR, a.Birthday, CURDATE()) as Age
      FROM Animal a
      LEFT JOIN exhibit e ON a.Enclosure_ID = e.Exhibit_ID
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
// VET VISITS (mapped to Animal_Care_Log)
// Note: there is no separate vet visits table in the database.
// We store/retrieve vet visit records using the existing Animal_Care_Log table.
// This keeps the same API surface (/vet-visits) while using the actual DB.
// ============================================

export const getAnimalVetHistory = async (req, res) => {
  try {
    const { animalId } = req.params;
    const params = [animalId];

    const [visits] = await db.query(
      `SELECT
        acl.Log_ID as Visit_ID,
        acl.Animal_ID,
        acl.Employee_ID,
        DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Visit_Date,
        acl.Activity as Diagnosis,
        acl.Notes as Treatment,
        e.First_Name,
        e.Last_Name,
        a.Animal_Name,
        a.Species
      FROM Animal_Care_Log acl
      LEFT JOIN Employee e ON acl.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON acl.Animal_ID = a.Animal_ID
      WHERE acl.Log_Type = 'medical' AND acl.Animal_ID = ?
      ORDER BY acl.Log_Date DESC`,
      params
    );

    res.json(visits);
  } catch (error) {
    console.error("Error fetching vet history:", error);
    res.status(500).json({ error: "Failed to fetch vet history" });
  }
};

export const getAllVetVisits = async (req, res) => {
  try {
    const [visits] = await db.query(
      `SELECT
        acl.Log_ID as Visit_ID,
        acl.Animal_ID,
        acl.Employee_ID,
        DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Visit_Date,
        acl.Activity as Diagnosis,
        acl.Notes as Treatment,
        e.First_Name,
        e.Last_Name,
        a.Animal_Name,
        a.Species
      FROM Animal_Care_Log acl
      LEFT JOIN Employee e ON acl.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON acl.Animal_ID = a.Animal_ID
      WHERE acl.Log_Type = 'medical'
      ORDER BY acl.Log_Date DESC
      LIMIT 50`
    );

    res.json(visits);
  } catch (error) {
    console.error("Error fetching vet visits:", error);
    res.status(500).json({ error: "Failed to fetch vet visits" });
  }
};

export const createVetVisit = async (req, res) => {
  try {
    const { animalId, employeeId, visitDate, diagnosis, treatment } = req.body;

    if (!animalId) {
      return res.status(400).json({ error: "Animal ID is required" });
    }

    const employeeIdValue =
      employeeId !== undefined && employeeId !== null ? employeeId : null;

    const rawVisitDate = visitDate || new Date();
    const parsedDate = new Date(rawVisitDate);
    const visitDateValue = isNaN(parsedDate.getTime())
      ? new Date()
      : parsedDate;

    // Use Animal_Care_Log to store medical/vet visits
    const activity = diagnosis || "Vet visit";

    const [result] = await db.query(
      `INSERT INTO Animal_Care_Log (Animal_ID, Employee_ID, Log_Date, Activity, Log_Type, Notes)
       VALUES (?, ?, ?, ?, 'medical', ?)`,
      [animalId, employeeIdValue, visitDateValue, activity, treatment || null]
    );

    const [newLog] = await db.query(
      `SELECT
        acl.Log_ID as Visit_ID,
        acl.Animal_ID,
        acl.Employee_ID,
        DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Visit_Date,
        acl.Activity as Diagnosis,
        acl.Notes as Treatment,
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
      message: "Vet visit created successfully",
      visit: newLog[0],
    });
  } catch (error) {
    console.error("Error creating vet visit:", error);
    res.status(500).json({ error: "Failed to create vet visit" });
  }
};

// ============================================
// UPDATE ANIMAL HEALTH INFO
// ============================================

export const updateAnimalHealthInfo = async (req, res) => {
  try {
    const { animalId } = req.params;
    const { healthStatus, isVaccinated, weight } = req.body;

    // Build dynamic UPDATE query with only provided fields
    const updates = [];
    const values = [];

    if (healthStatus !== undefined) {
      updates.push("Health_Status = ?");
      values.push(healthStatus);
    }
    if (isVaccinated !== undefined) {
      updates.push("Is_Vaccinated = ?");
      values.push(isVaccinated ? 1 : 0);
    }
    if (weight !== undefined) {
      updates.push("Weight = ?");
      values.push(weight);
    }

    // Only update if there are fields to update
    if (updates.length > 0) {
      values.push(animalId);
      await db.query(
        `UPDATE Animal SET ${updates.join(", ")} WHERE Animal_ID = ?`,
        values
      );
    }

    // Fetch updated animal
    const [updatedAnimal] = await db.query(
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
        e.exhibit_Name as Enclosure_Name,
        e.Enclosure_Type,
        TIMESTAMPDIFF(YEAR, a.Birthday, CURDATE()) as Age
      FROM Animal a
      LEFT JOIN exhibit e ON a.Enclosure_ID = e.Exhibit_ID
      WHERE a.Animal_ID = ?`,
      [animalId]
    );

    res.json({
      message: "Animal health info updated successfully",
      animal: updatedAnimal[0],
    });
  } catch (error) {
    console.error("Error updating animal health info:", error);
    res.status(500).json({ error: "Failed to update animal health info" });
  }
};

// ============================================
// MEDICAL & VACCINATION LOGS (using Animal_Care_Log)
// ============================================

export const getMedicalLogs = async (req, res) => {
  try {
    const { animalId } = req.params;
    const params = [];
    let where = ` WHERE acl.Log_Type = 'medical' OR acl.Log_Type = 'update' `;

    if (animalId) {
      where += ` AND acl.Animal_ID = ?`;
      params.push(animalId);
    }

    const [logs] = await db.query(
      `SELECT
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
        a.Species
      FROM Animal_Care_Log acl
      LEFT JOIN Employee e ON acl.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON acl.Animal_ID = a.Animal_ID
      ${where}
      ORDER BY acl.Log_Date DESC`,
      params
    );

    res.json(logs);
  } catch (error) {
    console.error("Error fetching medical logs:", error);
    res.status(500).json({ error: "Failed to fetch medical logs" });
  }
};

export const getVaccinationLogs = async (req, res) => {
  try {
    const { animalId } = req.params;
    const params = [];
    let where = ` WHERE acl.Log_Type = 'vaccinated' OR acl.Activity LIKE '%Vaccin%' `;

    if (animalId) {
      where += ` AND acl.Animal_ID = ?`;
      params.push(animalId);
    }

    const [logs] = await db.query(
      `SELECT
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
        a.Species
      FROM Animal_Care_Log acl
      LEFT JOIN Employee e ON acl.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON acl.Animal_ID = a.Animal_ID
      ${where}
      ORDER BY acl.Log_Date DESC`,
      params
    );

    res.json(logs);
  } catch (error) {
    console.error("Error fetching vaccination logs:", error);
    res.status(500).json({ error: "Failed to fetch vaccination logs" });
  }
};

export const createMedicalLog = async (req, res) => {
  try {
    const { animalId, employeeId, notes, activity, logDate } = req.body;
    if (!animalId) return res.status(400).json({ error: "Animal ID required" });

    const logDateValue = logDate ? new Date(logDate) : new Date();

    const [result] = await db.query(
      `INSERT INTO Animal_Care_Log (Animal_ID, Employee_ID, Log_Date, Activity, Log_Type, Notes)
       VALUES (?, ?, ?, ?, 'medical', ?)`,
      [
        animalId,
        employeeId || null,
        logDateValue,
        activity || "Medical note",
        notes || null,
      ]
    );

    const [newLog] = await db.query(
      `SELECT acl.Log_ID, acl.Animal_ID, acl.Employee_ID, DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Log_Date, acl.Activity, acl.Log_Type, acl.Notes, e.First_Name, e.Last_Name, a.Animal_Name, a.Species
       FROM Animal_Care_Log acl
       LEFT JOIN Employee e ON acl.Employee_ID = e.Employee_ID
       LEFT JOIN Animal a ON acl.Animal_ID = a.Animal_ID
       WHERE acl.Log_ID = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: "Medical log created", log: newLog[0] });
  } catch (error) {
    console.error("Error creating medical log:", error);
    res.status(500).json({ error: "Failed to create medical log" });
  }
};

export const createVaccinationLog = async (req, res) => {
  try {
    const {
      animalId,
      employeeId,
      vaccine,
      notes,
      markVaccinated = true,
      logDate,
    } = req.body;
    if (!animalId) return res.status(400).json({ error: "Animal ID required" });

    const activity = vaccine ? `Vaccination: ${vaccine}` : "Vaccination";
    const logDateValue = logDate ? new Date(logDate) : new Date();

    const [result] = await db.query(
      `INSERT INTO Animal_Care_Log (Animal_ID, Employee_ID, Log_Date, Activity, Log_Type, Notes)
       VALUES (?, ?, ?, ?, 'vaccinated', ?)`,
      [animalId, employeeId || null, logDateValue, activity, notes || null]
    );

    // Optionally mark the animal as vaccinated in Animal table
    if (markVaccinated) {
      await db.query(
        `UPDATE Animal SET Is_Vaccinated = 1 WHERE Animal_ID = ?`,
        [animalId]
      );
    }

    const [newLog] = await db.query(
      `SELECT acl.Log_ID, acl.Animal_ID, acl.Employee_ID, DATE_FORMAT(acl.Log_Date, '%Y-%m-%d %H:%i:%s') as Log_Date, acl.Activity, acl.Log_Type, acl.Notes, e.First_Name, e.Last_Name, a.Animal_Name, a.Species
       FROM Animal_Care_Log acl
       LEFT JOIN Employee e ON acl.Employee_ID = e.Employee_ID
       LEFT JOIN Animal a ON acl.Animal_ID = a.Animal_ID
       WHERE acl.Log_ID = ?`,
      [result.insertId]
    );

    res
      .status(201)
      .json({ message: "Vaccination log created", log: newLog[0] });
  } catch (error) {
    console.error("Error creating vaccination log:", error);
    res.status(500).json({ error: "Failed to create vaccination log" });
  }
};

// NOTE: Frontend (Figma design) uses more granular health states: Healthy, Under Observation, Sick, Injured, Critical.
// Current DB enum is: ('Needs Attention','Fair','Good','Excellent'). Mapping implemented client-side:
//   Excellent/Good -> Healthy, Fair -> Under Observation, Needs Attention -> Sick/Injured/Critical.
// For future improvement consider ALTER TABLE to expand enum and store granular states directly to reduce ambiguity.

// ============================================
// GET ALL EXHIBITS
// ============================================

export const getAllExhibits = async (req, res) => {
  try {
    const [exhibits] = await db.query(`
      SELECT 
        e.Exhibit_ID as Enclosure_ID,
        e.exhibit_Name as Enclosure_Name,
        e.Location_ID,
        e.Size,
        e.Enclosure_Type,
        l.Zone,
        l.Location_Description,
        COUNT(a.Animal_ID) as Animal_Count
      FROM exhibit e
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      LEFT JOIN Animal a ON e.Exhibit_ID = a.Enclosure_ID
      GROUP BY e.Exhibit_ID, e.exhibit_Name, e.Location_ID, e.Size, e.Enclosure_Type, l.Zone, l.Location_Description
      ORDER BY e.exhibit_Name
    `);
    res.json(exhibits);
  } catch (error) {
    console.error("Error fetching exhibits:", error);
    res.status(500).json({ error: "Failed to fetch exhibits" });
  }
};
