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
// VET VISITS
// ============================================

export const getAnimalVetHistory = async (req, res) => {
  try {
    const { animalId } = req.params;

    const [visits] = await db.query(
      `SELECT 
        vv.Visit_ID,
        vv.Animal_ID,
        vv.Employee_ID,
        DATE_FORMAT(vv.Visit_Date, '%Y-%m-%d %H:%i:%s') as Visit_Date,
        vv.Diagnosis,
        vv.Treatment,
        e.First_Name,
        e.Last_Name,
        a.Animal_Name,
        a.Species
      FROM Vet_Visit vv
      LEFT JOIN Employee e ON vv.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON vv.Animal_ID = a.Animal_ID
      WHERE vv.Animal_ID = ?
      ORDER BY vv.Visit_Date DESC`,
      [animalId]
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
        vv.Visit_ID,
        vv.Animal_ID,
        vv.Employee_ID,
        DATE_FORMAT(vv.Visit_Date, '%Y-%m-%d %H:%i:%s') as Visit_Date,
        vv.Diagnosis,
        vv.Treatment,
        e.First_Name,
        e.Last_Name,
        a.Animal_Name,
        a.Species
      FROM Vet_Visit vv
      LEFT JOIN Employee e ON vv.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON vv.Animal_ID = a.Animal_ID
      ORDER BY vv.Visit_Date DESC
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

    // Validate required fields
    if (!animalId || !employeeId) {
      return res
        .status(400)
        .json({ error: "Animal ID and Employee ID are required" });
    }

    const visitDateValue = visitDate || new Date();

    const [result] = await db.query(
      `INSERT INTO Vet_Visit (Animal_ID, Employee_ID, Visit_Date, Diagnosis, Treatment)
       VALUES (?, ?, ?, ?, ?)`,
      [animalId, employeeId, visitDateValue, diagnosis || null, treatment || null]
    );

    // Fetch the newly created visit
    const [newVisit] = await db.query(
      `SELECT 
        vv.Visit_ID,
        vv.Animal_ID,
        vv.Employee_ID,
        DATE_FORMAT(vv.Visit_Date, '%Y-%m-%d %H:%i:%s') as Visit_Date,
        vv.Diagnosis,
        vv.Treatment,
        e.First_Name,
        e.Last_Name,
        a.Animal_Name,
        a.Species
      FROM Vet_Visit vv
      LEFT JOIN Employee e ON vv.Employee_ID = e.Employee_ID
      LEFT JOIN Animal a ON vv.Animal_ID = a.Animal_ID
      WHERE vv.Visit_ID = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Vet visit created successfully",
      visit: newVisit[0],
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
        e.Enclosure_Name,
        e.Enclosure_Type,
        TIMESTAMPDIFF(YEAR, a.Birthday, CURDATE()) as Age
      FROM Animal a
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
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