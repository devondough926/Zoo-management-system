import db from "../config/database.js";

// ============================================
// EMPLOYEE MANAGEMENT
// ============================================

export const getAllEmployees = async (req, res) => {
  try {
    const [employees] = await db.query(`
      SELECT 
        e.*,
        jt.Title,
        jt.Description as Job_Description
      FROM Employee e
      LEFT JOIN Job_Title jt ON e.Job_ID = jt.Job_ID
      ORDER BY e.Last_Name, e.First_Name
    `);
    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [employees] = await db.query(
      `
      SELECT 
        e.*,
        jt.Title,
        jt.Description as Job_Description
      FROM Employee e
      LEFT JOIN Job_Title jt ON e.Job_ID = jt.Job_ID
      WHERE e.Employee_ID = ?
    `,
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(employees[0]);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
};

export const addEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      birthdate,
      sex,
      jobId,
      salary,
      email,
      address,
      supervisorId,
    } = req.body;

    const [result] = await db.query(
      `
      INSERT INTO Employee 
      (First_Name, Last_Name, Birthdate, Sex, Job_ID, Salary, Email, Address, Supervisor_ID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        firstName,
        lastName,
        birthdate,
        sex,
        jobId,
        salary,
        email,
        address,
        supervisorId || null,
      ]
    );

    // Fetch the newly created employee with job title
    const [newEmployee] = await db.query(
      `
      SELECT 
        e.*,
        jt.Title,
        jt.Description as Job_Description
      FROM Employee e
      LEFT JOIN Job_Title jt ON e.Job_ID = jt.Job_ID
      WHERE e.Employee_ID = ?
    `,
      [result.insertId]
    );

    res.status(201).json(newEmployee[0]);
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json({ error: "Failed to add employee" });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      birthdate,
      sex,
      jobId,
      salary,
      email,
      address,
      supervisorId,
    } = req.body;

    await db.query(
      `
      UPDATE Employee 
      SET First_Name = ?, Last_Name = ?, Birthdate = ?, Sex = ?, 
          Job_ID = ?, Salary = ?, Email = ?, Address = ?, Supervisor_ID = ?
      WHERE Employee_ID = ?
    `,
      [
        firstName,
        lastName,
        birthdate,
        sex,
        jobId,
        salary,
        email,
        address,
        supervisorId || null,
        id,
      ]
    );

    // Fetch updated employee
    const [updatedEmployee] = await db.query(
      `
      SELECT 
        e.*,
        jt.Title,
        jt.Description as Job_Description
      FROM Employee e
      LEFT JOIN Job_Title jt ON e.Job_ID = jt.Job_ID
      WHERE e.Employee_ID = ?
    `,
      [id]
    );

    res.json(updatedEmployee[0]);
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ error: "Failed to update employee" });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const [employees] = await db.query(
      "SELECT * FROM Employee WHERE Employee_ID = ?",
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Note: If you've run the migration with SET NULL constraints,
    // these manual updates are not strictly necessary but provide safety

    // Remove this employee as supervisor from any locations
    await db.query(
      "UPDATE Location SET Supervisor_ID = NULL WHERE Supervisor_ID = ?",
      [id]
    );

    // Update any subordinate employees to have no supervisor
    await db.query(
      "UPDATE Employee SET Supervisor_ID = NULL WHERE Supervisor_ID = ?",
      [id]
    );

    // Delete the employee
    // If foreign keys are SET NULL, related records will be preserved
    // If foreign keys are CASCADE, related records will be deleted
    const [result] = await db.query(
      "DELETE FROM Employee WHERE Employee_ID = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({
      message: "Employee deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting employee:", error);

    // Check for foreign key constraint errors
    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_ROW_IS_REFERENCED"
    ) {
      return res.status(400).json({
        error:
          "Cannot delete employee: Employee has associated records that prevent deletion. Please run the database migration to update foreign key constraints.",
        details: error.sqlMessage || error.message,
      });
    }

    res.status(500).json({
      error: "Failed to delete employee",
      details: error.message,
    });
  }
};

export const updateEmployeeSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { salary } = req.body;

    await db.query("UPDATE Employee SET Salary = ? WHERE Employee_ID = ?", [
      salary,
      id,
    ]);

    res.json({ message: "Salary updated successfully" });
  } catch (error) {
    console.error("Error updating salary:", error);
    res.status(500).json({ error: "Failed to update salary" });
  }
};

// ============================================
// LOCATION & ZONE MANAGEMENT
// ============================================

export const getAllLocations = async (req, res) => {
  try {
    const [locations] = await db.query(`
      SELECT 
        l.*,
        e.First_Name as Supervisor_First_Name,
        e.Last_Name as Supervisor_Last_Name
      FROM Location l
      LEFT JOIN Employee e ON l.Supervisor_ID = e.Employee_ID
      ORDER BY l.Zone
    `);
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
};

export const updateLocationSupervisor = async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisorId } = req.body;

    await db.query(
      "UPDATE Location SET Supervisor_ID = ? WHERE Location_ID = ?",
      [supervisorId || null, id]
    );

    const [updatedLocation] = await db.query(
      `
      SELECT 
        l.*,
        e.First_Name as Supervisor_First_Name,
        e.Last_Name as Supervisor_Last_Name
      FROM Location l
      LEFT JOIN Employee e ON l.Supervisor_ID = e.Employee_ID
      WHERE l.Location_ID = ?
    `,
      [id]
    );

    res.json(updatedLocation[0]);
  } catch (error) {
    console.error("Error updating location supervisor:", error);
    res.status(500).json({ error: "Failed to update supervisor" });
  }
};

// ============================================
// EXHIBIT MANAGEMENT
// ============================================

export const getAllExhibits = async (req, res) => {
  try {
    const [exhibits] = await db.query(`
      SELECT 
        e.*,
        l.Location_Description,
        l.Zone
      FROM Exhibit e
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      ORDER BY e.exhibit_Name
    `);
    res.json(exhibits);
  } catch (error) {
    console.error("Error fetching exhibits:", error);
    res.status(500).json({ error: "Failed to fetch exhibits" });
  }
};

export const getExhibitById = async (req, res) => {
  try {
    const { id } = req.params;
    const [exhibits] = await db.query(
      `
      SELECT 
        e.*,
        l.Location_Description,
        l.Zone
      FROM Exhibit e
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      WHERE e.Exhibit_ID = ?
    `,
      [id]
    );

    if (exhibits.length === 0) {
      return res.status(404).json({ error: "Exhibit not found" });
    }

    res.json(exhibits[0]);
  } catch (error) {
    console.error("Error fetching exhibit:", error);
    res.status(500).json({ error: "Failed to fetch exhibit" });
  }
};

export const updateExhibit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, capacity, displayTime, locationId, imageUrl } =
      req.body;

    // Build dynamic UPDATE query with only provided fields
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("exhibit_Name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      updates.push("exhibit_Description = ?");
      values.push(description);
    }
    if (capacity !== undefined) {
      updates.push("Capacity = ?");
      values.push(capacity);
    }
    if (displayTime !== undefined) {
      updates.push("Display_Time = ?");
      values.push(displayTime);
    }
    if (locationId !== undefined) {
      updates.push("Location_ID = ?");
      values.push(locationId);
    }
    if (imageUrl !== undefined) {
      updates.push("Image_URL = ?");
      values.push(imageUrl || null);
    }

    // Only update if there are fields to update
    if (updates.length > 0) {
      values.push(id);
      await db.query(
        `UPDATE Exhibit SET ${updates.join(", ")} WHERE Exhibit_ID = ?`,
        values
      );
    }

    // Fetch updated exhibit
    const [updatedExhibit] = await db.query(
      `
      SELECT 
        e.*,
        l.Location_Description,
        l.Zone
      FROM Exhibit e
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      WHERE e.Exhibit_ID = ?
    `,
      [id]
    );

    res.json(updatedExhibit[0]);
  } catch (error) {
    console.error("Error updating exhibit:", error);
    res.status(500).json({ error: "Failed to update exhibit" });
  }
};

// ============================================
// ANIMAL MANAGEMENT
// ============================================

export const getAllAnimals = async (req, res) => {
  try {
    const [animals] = await db.query(`
      SELECT 
        a.*,
        e.Enclosure_Name,
        e.Enclosure_Type,
        e.Location_ID
      FROM Animal a
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
      ORDER BY a.Animal_Name
    `);
    res.json(animals);
  } catch (error) {
    console.error("Error fetching animals:", error);
    res.status(500).json({ error: "Failed to fetch animals" });
  }
};

export const getAnimalById = async (req, res) => {
  try {
    const { id } = req.params;
    const [animals] = await db.query(
      `
      SELECT 
        a.*,
        e.Enclosure_Name,
        e.Enclosure_Type,
        e.Location_ID
      FROM Animal a
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
      WHERE a.Animal_ID = ?
    `,
      [id]
    );

    if (animals.length === 0) {
      return res.status(404).json({ error: "Animal not found" });
    }

    res.json(animals[0]);
  } catch (error) {
    console.error("Error fetching animal:", error);
    res.status(500).json({ error: "Failed to fetch animal" });
  }
};

export const addAnimal = async (req, res) => {
  try {
    const {
      name,
      species,
      gender,
      weight,
      birthday,
      healthStatus,
      isVaccinated,
      enclosureId,
      imageUrl,
    } = req.body;

    const [result] = await db.query(
      `
      INSERT INTO Animal 
      (Animal_Name, Species, Gender, Weight, Birthday, Health_Status, Is_Vaccinated, Enclosure_ID, Image_URL)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        name,
        species,
        gender,
        weight,
        // Fix: Ensure birthday is in YYYY-MM-DD format for MySQL DATE type
        // MySQL DATE type expects YYYY-MM-DD format and doesn't handle timezone
        typeof birthday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthday)
          ? birthday  // Already in correct format, use as-is
          : new Date(birthday).toISOString().split('T')[0],  // Fallback: format other date formats
        healthStatus || "Good",
        isVaccinated ? 1 : 0,
        enclosureId,
        imageUrl || null,
      ]
    );

    // Fetch the newly created animal with enclosure info
    const [newAnimal] = await db.query(
      `
      SELECT 
        a.*,
        e.Enclosure_Name,
        e.Enclosure_Type,
        e.Location_ID
      FROM Animal a
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
      WHERE a.Animal_ID = ?
    `,
      [result.insertId]
    );

    res.status(201).json(newAnimal[0]);
  } catch (error) {
    console.error("Error adding animal:", error);
    res.status(500).json({ error: "Failed to add animal" });
  }
};

export const updateAnimal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      species,
      gender,
      weight,
      birthday,
      healthStatus,
      isVaccinated,
      enclosureId,
      imageUrl,
    } = req.body;

    // Build dynamic UPDATE query with only provided fields
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("Animal_Name = ?");
      values.push(name);
    }
    if (species !== undefined) {
      updates.push("Species = ?");
      values.push(species);
    }
    if (gender !== undefined) {
      updates.push("Gender = ?");
      values.push(gender);
    }
    if (weight !== undefined) {
      updates.push("Weight = ?");
      values.push(weight);
    }
    if (birthday !== undefined) {
      updates.push("Birthday = ?");
      // Fix: Ensure birthday is in YYYY-MM-DD format for MySQL DATE type
      // MySQL DATE type expects YYYY-MM-DD format and doesn't handle timezone
      // The frontend sends dates as YYYY-MM-DD strings, so we use them directly
      // No Date object conversion needed - MySQL stores DATE as date-only (no time/timezone)
      const birthdayValue = typeof birthday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthday)
        ? birthday  // Already in correct format, use as-is
        : new Date(birthday).toISOString().split('T')[0];  // Fallback: format other date formats
      values.push(birthdayValue);
    }
    if (healthStatus !== undefined) {
      updates.push("Health_Status = ?");
      values.push(healthStatus);
    }
    if (isVaccinated !== undefined) {
      updates.push("Is_Vaccinated = ?");
      values.push(isVaccinated ? 1 : 0);
    }
    if (enclosureId !== undefined) {
      updates.push("Enclosure_ID = ?");
      values.push(enclosureId);
    }
    if (imageUrl !== undefined) {
      updates.push("Image_URL = ?");
      values.push(imageUrl || null);
    }

    // Only update if there are fields to update
    if (updates.length > 0) {
      values.push(id); // Add ID for WHERE clause
      await db.query(
        `UPDATE Animal SET ${updates.join(", ")} WHERE Animal_ID = ?`,
        values
      );
    }

    // Fetch updated animal
    const [updatedAnimal] = await db.query(
      `
      SELECT 
        a.*,
        e.Enclosure_Name,
        e.Enclosure_Type,
        e.Location_ID
      FROM Animal a
      LEFT JOIN Enclosure e ON a.Enclosure_ID = e.Enclosure_ID
      WHERE a.Animal_ID = ?
    `,
      [id]
    );

    res.json(updatedAnimal[0]);
  } catch (error) {
    console.error("Error updating animal:", error);
    res.status(500).json({ error: "Failed to update animal" });
  }
};

export const deleteAnimal = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM Animal WHERE Animal_ID = ?", [id]);

    res.json({ message: "Animal deleted successfully" });
  } catch (error) {
    console.error("Error deleting animal:", error);
    res.status(500).json({ error: "Failed to delete animal" });
  }
};

// ============================================
// REVENUE & ANALYTICS
// ============================================

export const getRevenueData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = "";
    const params = [];

    if (startDate && endDate) {
      dateFilter = "WHERE p.Purchase_Date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    // Get ticket revenue and sales breakdown
    const [ticketRevenue] = await db.query(
      `
      SELECT COALESCE(SUM(t.Price * t.Quantity), 0) as revenue
      FROM Ticket t
      JOIN Purchase p ON t.Purchase_ID = p.Purchase_ID
      ${dateFilter}
    `,
      params
    );

    // Get ticket sales by type
    const [ticketSales] = await db.query(
      `
      SELECT 
        t.Ticket_Type,
        COALESCE(SUM(t.Quantity), 0) as total_sold
      FROM Ticket t
      JOIN Purchase p ON t.Purchase_ID = p.Purchase_ID
      ${dateFilter}
      GROUP BY t.Ticket_Type
    `,
      params
    );

    // Transform ticket sales into object
    const ticketSalesObj = {
      adultTickets: 0,
      childTickets: 0,
      seniorTickets: 0,
      studentTickets: 0,
    };

    ticketSales.forEach((sale) => {
      switch (sale.Ticket_Type) {
        case "Adult":
          ticketSalesObj.adultTickets = sale.total_sold;
          break;
        case "Child":
          ticketSalesObj.childTickets = sale.total_sold;
          break;
        case "Senior":
          ticketSalesObj.seniorTickets = sale.total_sold;
          break;
        case "Student":
          ticketSalesObj.studentTickets = sale.total_sold;
          break;
      }
    });

    // Get gift shop revenue
    const [giftShopRevenue] = await db.query(
      `
      SELECT COALESCE(SUM(pi.Unit_Price * pi.Quantity), 0) as revenue
      FROM Purchase_Item pi
      JOIN Purchase p ON pi.Purchase_ID = p.Purchase_ID
      WHERE pi.Item_ID != 9000
      ${dateFilter ? "AND " + dateFilter.replace("WHERE ", "") : ""}
    `,
      params
    );

    // Get food revenue
    const [foodRevenue] = await db.query(
      `
      SELECT COALESCE(SUM(pci.Unit_Price * pci.Quantity), 0) as revenue
      FROM Purchase_Concession_Item pci
      JOIN Purchase p ON pci.Purchase_ID = p.Purchase_ID
      ${dateFilter}
    `,
      params
    );

    // Get membership revenue
    const [membershipRevenue] = await db.query(
      `
      SELECT COALESCE(SUM(pi.Unit_Price * pi.Quantity), 0) as revenue
      FROM Purchase_Item pi
      JOIN Purchase p ON pi.Purchase_ID = p.Purchase_ID
      WHERE pi.Item_ID = 9000
      ${dateFilter ? "AND " + dateFilter.replace("WHERE ", "") : ""}
    `,
      params
    );

    res.json({
      ticketRevenue: parseFloat(ticketRevenue[0].revenue),
      giftShopRevenue: parseFloat(giftShopRevenue[0].revenue),
      foodRevenue: parseFloat(foodRevenue[0].revenue),
      membershipRevenue: parseFloat(membershipRevenue[0].revenue),
      totalRevenue:
        parseFloat(ticketRevenue[0].revenue) +
        parseFloat(giftShopRevenue[0].revenue) +
        parseFloat(foodRevenue[0].revenue) +
        parseFloat(membershipRevenue[0].revenue),
      ticketSales: ticketSalesObj,
    });
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
};

export const getStatistics = async (req, res) => {
  try {
    // Get total animals
    const [animalCount] = await db.query(
      "SELECT COUNT(*) as count FROM Animal"
    );

    // Get total employees
    const [employeeCount] = await db.query(
      "SELECT COUNT(*) as count FROM Employee"
    );

    // Get active memberships
    const [membershipCount] = await db.query(
      "SELECT COUNT(*) as count FROM Membership WHERE Membership_Status = 1"
    );

    // Get total purchases today
    const [purchasesToday] = await db.query(
      `
      SELECT COUNT(*) as count 
      FROM Purchase 
      WHERE DATE(Purchase_Date) = CURDATE()
    `
    );

    res.json({
      totalAnimals: animalCount[0].count,
      totalEmployees: employeeCount[0].count,
      activeMemberships: membershipCount[0].count,
      purchasesToday: purchasesToday[0].count,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

// ============================================
// JOB TITLES
// ============================================

export const getAllJobTitles = async (req, res) => {
  try {
    const [jobTitles] = await db.query(
      "SELECT * FROM Job_Title ORDER BY Job_ID"
    );
    res.json(jobTitles);
  } catch (error) {
    console.error("Error fetching job titles:", error);
    res.status(500).json({ error: "Failed to fetch job titles" });
  }
};

// ============================================
// ENCLOSURES
// ============================================

export const getAllEnclosures = async (req, res) => {
  try {
    const [enclosures] = await db.query(`
      SELECT 
        e.*,
        l.Zone,
        l.Location_Description
      FROM Enclosure e
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      ORDER BY e.Enclosure_Name
    `);
    res.json(enclosures);
  } catch (error) {
    console.error("Error fetching enclosures:", error);
    res.status(500).json({ error: "Failed to fetch enclosures" });
  }
};

// ============================================
// PURCHASES & TICKETS
// ============================================

export const getAllPurchases = async (req, res) => {
  try {
    const [purchases] = await db.query(`
      SELECT 
        p.*,
        c.First_Name,
        c.Last_Name,
        c.Email
      FROM Purchase p
      LEFT JOIN Customer c ON p.Customer_ID = c.Customer_ID
      ORDER BY p.Purchase_Date DESC
    `);
    res.json(purchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const [tickets] = await db.query(`
      SELECT 
        t.*,
        p.Purchase_Date,
        p.Customer_ID
      FROM Ticket t
      JOIN Purchase p ON t.Purchase_ID = p.Purchase_ID
      ORDER BY p.Purchase_Date DESC
    `);
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

export const getPurchaseItems = async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT 
        pi.*,
        i.Item_Name,
        i.Category,
        p.Purchase_Date
      FROM Purchase_Item pi
      JOIN Item i ON pi.Item_ID = i.Item_ID
      JOIN Purchase p ON pi.Purchase_ID = p.Purchase_ID
      ORDER BY p.Purchase_Date DESC
    `);
    res.json(items);
  } catch (error) {
    console.error("Error fetching purchase items:", error);
    res.status(500).json({ error: "Failed to fetch purchase items" });
  }
};

export const getPurchaseConcessionItems = async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT 
        pci.*,
        ci.Item_Name,
        ci.Stand_ID,
        p.Purchase_Date
      FROM Purchase_Concession_Item pci
      JOIN Concession_Item ci ON pci.Concession_Item_ID = ci.Concession_Item_ID
      JOIN Purchase p ON pci.Purchase_ID = p.Purchase_ID
      ORDER BY p.Purchase_Date DESC
    `);
    res.json(items);
  } catch (error) {
    console.error("Error fetching purchase concession items:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch purchase concession items" });
  }
};

export const getAllMemberships = async (req, res) => {
  try {
    const [memberships] = await db.query(`
      SELECT 
        m.*,
        c.First_Name,
        c.Last_Name,
        c.Email
      FROM Membership m
      JOIN Customer c ON m.Customer_ID = c.Customer_ID
      ORDER BY m.Start_Date DESC
    `);
    res.json(memberships);
  } catch (error) {
    console.error("Error fetching memberships:", error);
    res.status(500).json({ error: "Failed to fetch memberships" });
  }
};

// ============================================
// PRICING MANAGEMENT
// ============================================

export const getPricing = async (req, res) => {
  try {
    // Get pricing from Config table
    const [config] = await db.query(`
      SELECT Config_Key, Config_Value
      FROM Config
      WHERE Config_Key IN ('ticket_adult', 'ticket_child', 'ticket_senior', 'ticket_student', 'membership_annual')
    `);

    // If no config exists, return default prices
    if (config.length === 0) {
      return res.json({
        ticketPrices: {
          adult: 29.99,
          child: 14.99,
          senior: 24.99,
          student: 19.99,
        },
        membershipPrice: 149.99,
      });
    }

    // Transform config array to pricing object
    const pricing = {
      ticketPrices: {
        adult: 29.99,
        child: 14.99,
        senior: 24.99,
        student: 19.99,
      },
      membershipPrice: 149.99,
    };

    config.forEach((item) => {
      const value = parseFloat(item.Config_Value);
      switch (item.Config_Key) {
        case "ticket_adult":
          pricing.ticketPrices.adult = value;
          break;
        case "ticket_child":
          pricing.ticketPrices.child = value;
          break;
        case "ticket_senior":
          pricing.ticketPrices.senior = value;
          break;
        case "ticket_student":
          pricing.ticketPrices.student = value;
          break;
        case "membership_annual":
          pricing.membershipPrice = value;
          break;
      }
    });

    res.json(pricing);
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({ error: "Failed to fetch pricing" });
  }
};

export const updatePricing = async (req, res) => {
  try {
    const { ticketPrices, membershipPrice } = req.body;

    // Prepare pricing updates
    const updates = [
      { key: "ticket_adult", value: ticketPrices.adult },
      { key: "ticket_child", value: ticketPrices.child },
      { key: "ticket_senior", value: ticketPrices.senior },
      { key: "ticket_student", value: ticketPrices.student },
      { key: "membership_annual", value: membershipPrice },
    ];

    // Update or insert each pricing config
    for (const update of updates) {
      await db.query(
        `
        INSERT INTO Config (Config_Key, Config_Value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE Config_Value = ?
      `,
        [update.key, update.value.toString(), update.value.toString()]
      );
    }

    res.json({ message: "Pricing updated successfully" });
  } catch (error) {
    console.error("Error updating pricing:", error);
    res.status(500).json({ error: "Failed to update pricing" });
  }
};
