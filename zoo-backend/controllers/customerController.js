import db from "../config/database.js";

const formatDateForResponse = (date) => {
  if (!date) return null;

  // If it's already a string in the correct format, return as-is
  if (typeof date === "string") {
    // Check if it matches YYYY-MM-DD HH:MM:SS format
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)) {
      return date;
    }
  }

  // For Date objects, format manually to avoid timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const getAllExhibits = async (req, res) => {
  try {
    const [exhibits] = await db.query(`
      SELECT 
        e.Exhibit_ID,
        e.exhibit_Name,
        e.exhibit_Description,
        e.Capacity,
        e.Location_ID,
        e.Display_Time,
        e.Image_URL,
        l.Location_Description,
        l.Zone as Zone_Name
      FROM Exhibit e
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      ORDER BY e.Exhibit_ID
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
        e.Exhibit_ID,
        e.exhibit_Name,
        e.exhibit_Description,
        e.Capacity,
        e.Location_ID,
        e.Display_Time,
        e.Image_URL,
        l.Location_Description,
        l.Zone as Zone_Name
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

export const getAllActivities = async (req, res) => {
  try {
    const [activities] = await db.query(`
      SELECT 
        ea.Activity_ID,
        ea.Exhibit_ID,
        ea.Activity_Name,
        ea.Activity_Description,
        ea.Activity_Order,
        e.exhibit_Name,
        e.Display_Time,
        l.Zone as Zone_Name
      FROM Exhibit_Activity ea
      LEFT JOIN Exhibit e ON ea.Exhibit_ID = e.Exhibit_ID
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      ORDER BY ea.Activity_ID
    `);
    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
};

export const getActivitiesByExhibit = async (req, res) => {
  try {
    const { exhibitId } = req.params;
    const [activities] = await db.query(
      `
      SELECT 
        ea.Activity_ID,
        ea.Exhibit_ID,
        ea.Activity_Name,
        ea.Activity_Description,
        ea.Activity_Order,
        e.exhibit_Name,
        e.Display_Time,
        l.Zone as Zone_Name
      FROM Exhibit_Activity ea
      LEFT JOIN Exhibit e ON ea.Exhibit_ID = e.Exhibit_ID
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      WHERE ea.Exhibit_ID = ?
      ORDER BY ea.Activity_Order
    `,
      [exhibitId]
    );
    res.json(activities);
  } catch (error) {
    console.error("Error fetching exhibit activities:", error);
    console.error("SQL Error details:", error.sqlMessage);
    res.status(500).json({ error: "Failed to fetch exhibit activities" });
  }
};

export const getTodaysSchedule = async (req, res) => {
  try {
    // Calculate which activity order to show based on day of year
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Even days: Activity_Order 1, Odd days: Activity_Order 2
    const activityOrder = dayOfYear % 2 === 0 ? 1 : 2;

    const [schedule] = await db.query(
      `
      SELECT 
        ea.Activity_Name,
        ea.Activity_Description,
        e.exhibit_Name as location,
        e.Display_Time as time,
        l.Zone as Zone_Name
      FROM Exhibit_Activity ea
      JOIN Exhibit e ON ea.Exhibit_ID = e.Exhibit_ID
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      WHERE ea.Activity_Order = ?
      ORDER BY e.Display_Time
    `,
      [activityOrder]
    );

    res.json(schedule);
  } catch (error) {
    console.error("Error fetching today's schedule:", error);
    console.error("SQL Error details:", error.sqlMessage);
    res.status(500).json({
      error: "Failed to fetch today's schedule",
      details: error.message,
    });
  }
};

export const getAllAnimals = async (req, res) => {
  try {
    const [animals] = await db.query(`
      SELECT 
        a.*,
        e.Enclosure_Name,
        e.Enclosure_Type
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

export const getAllEnclosures = async (req, res) => {
  try {
    const [enclosures] = await db.query(`
      SELECT 
        Enclosure_ID,
        Enclosure_Name,
        Enclosure_Type
      FROM Enclosure
      ORDER BY Enclosure_Name
    `);
    res.json(enclosures);
  } catch (error) {
    console.error("Error fetching enclosures:", error);
    res.status(500).json({ error: "Failed to fetch enclosures" });
  }
};

export const getPurchaseHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    const [purchases] = await db.query(
      `
      SELECT 
        Purchase_ID,
        Customer_ID,
        DATE_FORMAT(Purchase_Date, '%Y-%m-%d %H:%i:%s') as Purchase_Date,
        CAST(Total_Amount AS DECIMAL(10,2)) as Total_Amount,
        Payment_Method
      FROM Purchase
      WHERE Customer_ID = ?
      ORDER BY Purchase_Date ASC, Purchase_ID ASC
    `,
      [customerId]
    );

    // Calculate customer-specific order numbers (oldest = 1, newest = N)
    // Then reverse the array to show newest first
    const formattedPurchases = purchases
      .map((purchase, index) => ({
        ...purchase,
        Order_Number: index + 1,
        Total_Amount: parseFloat(purchase.Total_Amount),
      }))
      .reverse();

    res.json(formattedPurchases);
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    res.status(500).json({ error: "Failed to fetch purchase history" });
  }
};

export const getPurchaseDetails = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    // Get purchase info
    const [purchases] = await db.query(
      `
      SELECT 
        p.Purchase_ID,
        p.Customer_ID,
        p.Purchase_Date,
        CAST(p.Total_Amount AS DECIMAL(10,2)) as Total_Amount,
        p.Payment_Method,
        c.First_Name,
        c.Last_Name,
        c.Email
      FROM Purchase p
      JOIN Customer c ON p.Customer_ID = c.Customer_ID
      WHERE p.Purchase_ID = ?
    `,
      [purchaseId]
    );

    if (purchases.length === 0) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    const purchase = {
      ...purchases[0],
      Purchase_Date: formatDateForResponse(purchases[0].Purchase_Date),
      Total_Amount: parseFloat(purchases[0].Total_Amount),
    };

    // Get tickets for this purchase
    const [tickets] = await db.query(
      `
      SELECT 
        Ticket_ID,
        Purchase_ID,
        Ticket_Type,
        CAST(Price AS DECIMAL(10,2)) as Price,
        Quantity
      FROM Ticket
      WHERE Purchase_ID = ?
    `,
      [purchaseId]
    );

    // Get purchase items (gift shop) for this purchase
    const [purchaseItems] = await db.query(
      `
      SELECT 
        pi.Purchase_ID,
        pi.Item_ID,
        pi.Quantity,
        CAST(pi.Unit_Price AS DECIMAL(10,2)) as Unit_Price,
        i.Item_Name,
        i.Image_URL
      FROM Purchase_Item pi
      JOIN Item i ON pi.Item_ID = i.Item_ID
      WHERE pi.Purchase_ID = ?
    `,
      [purchaseId]
    );

    // Get concession items for this purchase
    const [concessionItems] = await db.query(
      `
      SELECT 
        pci.Purchase_ID,
        pci.Concession_Item_ID,
        pci.Quantity,
        CAST(pci.Unit_Price AS DECIMAL(10,2)) as Unit_Price,
        ci.Item_Name
      FROM Purchase_Concession_Item pci
      JOIN Concession_Item ci ON pci.Concession_Item_ID = ci.Concession_Item_ID
      WHERE pci.Purchase_ID = ?
    `,
      [purchaseId]
    );

    const formattedTickets = tickets.map((t) => ({
      ...t,
      Price: parseFloat(t.Price),
    }));

    const formattedPurchaseItems = purchaseItems.map((pi) => ({
      ...pi,
      Unit_Price: parseFloat(pi.Unit_Price),
    }));

    const formattedConcessionItems = concessionItems.map((ci) => ({
      ...ci,
      Unit_Price: parseFloat(ci.Unit_Price),
    }));

    res.json({
      purchase: purchase,
      tickets: formattedTickets,
      purchaseItems: formattedPurchaseItems,
      concessionItems: formattedConcessionItems,
    });
  } catch (error) {
    console.error("Error fetching purchase details:", error);
    console.error("Error message:", error.message);
    console.error("SQL Error:", error.sqlMessage);
    res.status(500).json({
      error: "Failed to fetch purchase details",
      details: error.sqlMessage || error.message,
    });
  }
};

// Create a new purchase with all items
export const createPurchase = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      customerId,
      totalAmount,
      paymentMethod = "Card",
      purchaseDate,
      tickets = [],
      items = [],
      concessionItems = [],
      membership = null,
    } = req.body;

    // Validate required fields
    if (!customerId || totalAmount === undefined) {
      await connection.rollback();
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Use provided purchaseDate or current time
    // Convert client date to MySQL datetime format
    const purchaseDateValue =
      purchaseDate || new Date().toISOString().slice(0, 19).replace("T", " ");

    // Create the purchase record
    const [purchaseResult] = await connection.query(
      `
      INSERT INTO Purchase (Customer_ID, Purchase_Date, Total_Amount, Payment_Method)
      VALUES (?, ?, ?, ?)
    `,
      [customerId, purchaseDateValue, totalAmount, paymentMethod]
    );

    const purchaseId = purchaseResult.insertId;

    // Insert tickets
    if (tickets.length > 0) {
      for (const ticket of tickets) {
        await connection.query(
          `
          INSERT INTO Ticket (Purchase_ID, Ticket_Type, Price, Quantity)
          VALUES (?, ?, ?, ?)
        `,
          [purchaseId, ticket.ticketType, ticket.price, ticket.quantity]
        );
      }
    }

    // Insert purchase items (gift shop)
    if (items.length > 0) {
      for (const item of items) {
        await connection.query(
          `
          INSERT INTO Purchase_Item (Purchase_ID, Item_ID, Quantity, Unit_Price)
          VALUES (?, ?, ?, ?)
        `,
          [purchaseId, item.itemId, item.quantity, item.unitPrice]
        );
      }
    }

    // Insert concession items
    if (concessionItems.length > 0) {
      for (const item of concessionItems) {
        await connection.query(
          `
          INSERT INTO Purchase_Concession_Item (Purchase_ID, Concession_Item_ID, Quantity, Unit_Price)
          VALUES (?, ?, ?, ?)
        `,
          [purchaseId, item.concessionItemId, item.quantity, item.unitPrice]
        );
      }
    }

    // Handle membership if included
    if (membership) {
      // Fetch authoritative membership price from Config table
      const [configRows] = await connection.query(
        `SELECT Config_Value FROM Config WHERE Config_Key = ? LIMIT 1`,
        ["membership_annual"]
      );

      const membershipPrice =
        configRows && configRows.length > 0
          ? parseFloat(configRows[0].Config_Value)
          : membership.price || 149.99;

      // Check if customer already has a membership
      const [existingMembership] = await connection.query(
        `
        SELECT Membership_ID, End_Date
        FROM Membership
        WHERE Customer_ID = ?
        LIMIT 1
      `,
        [customerId]
      );

      const startDate = new Date();
      let endDate = new Date();

      // If existing membership and it's still valid, extend from its end date
      if (existingMembership.length > 0 && existingMembership[0].End_Date) {
        const existingEndDate = new Date(existingMembership[0].End_Date);
        if (existingEndDate > startDate) {
          endDate = new Date(existingEndDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      if (existingMembership.length > 0) {
        // Update existing membership with authoritative price
        await connection.query(
          `
          UPDATE Membership
          SET Membership_Status = 1,
              End_Date = ?,
              Price = ?
          WHERE Customer_ID = ?
        `,
          [endDate, membershipPrice, customerId]
        );
      } else {
        // Create new membership with authoritative price
        await connection.query(
          `
          INSERT INTO Membership (Customer_ID, Membership_Status, Start_Date, End_Date, Price)
          VALUES (?, 1, ?, ?, ?)
        `,
          [customerId, startDate, endDate, membershipPrice]
        );
      }
    }

    await connection.commit();

    // Fetch the created purchase with details
    const [createdPurchase] = await connection.query(
      `
      SELECT 
        Purchase_ID,
        Customer_ID,
        Purchase_Date,
        CAST(Total_Amount AS DECIMAL(10,2)) as Total_Amount,
        Payment_Method
      FROM Purchase
      WHERE Purchase_ID = ?
    `,
      [purchaseId]
    );

    const formattedPurchase = {
      ...createdPurchase[0],
      Purchase_Date: formatDateForResponse(createdPurchase[0].Purchase_Date),
      Total_Amount: parseFloat(createdPurchase[0].Total_Amount),
    };

    res.status(201).json({
      message: "Purchase created successfully",
      purchase: formattedPurchase,
      purchaseId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating purchase:", error);
    res.status(500).json({ error: "Failed to create purchase" });
  } finally {
    connection.release();
  }
};

export const getMembership = async (req, res) => {
  try {
    const { customerId } = req.params;

    const [memberships] = await db.query(
      `
      SELECT 
        Customer_ID,
        Price,
        Start_Date,
        End_Date,
        Membership_Status
      FROM Membership
      WHERE Customer_ID = ?
    `,
      [customerId]
    );

    if (memberships.length === 0) {
      return res.json(null);
    }

    const membership = memberships[0];
    // Normalize Membership_Status which may be stored as numeric, boolean, or string (e.g., 'Active')
    const rawStatus = membership.Membership_Status;
    const normalizedStatus =
      rawStatus === 1 ||
      rawStatus === "1" ||
      rawStatus === true ||
      (typeof rawStatus === "string" && rawStatus.toLowerCase() === "active");

    res.json({
      Customer_ID: membership.Customer_ID,
      Price: parseFloat(membership.Price),
      Start_Date: membership.Start_Date,
      End_Date: membership.End_Date,
      Membership_Status: !!normalizedStatus,
    });
  } catch (error) {
    console.error("Error fetching membership:", error);
    res.status(500).json({ error: "Failed to fetch membership" });
  }
};
