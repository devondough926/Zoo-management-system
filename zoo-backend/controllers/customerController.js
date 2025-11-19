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
        e.Enclosure_Type,
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
        e.Enclosure_Type,
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

// Get activities by activity order (for even/odd day filtering)
export const getActivitiesByOrder = async (req, res) => {
  try {
    const { order } = req.params;

    // Validate order parameter
    if (order !== "1" && order !== "2") {
      return res.status(400).json({ error: "Activity order must be 1 or 2" });
    }

    const [activities] = await db.query(
      `
      SELECT 
        ea.Activity_ID,
        ea.Exhibit_ID,
        ea.Activity_Name,
        ea.Activity_Description,
        ea.Activity_Order,
        ea.Duration,
        e.exhibit_Name,
        e.Display_Time,
        l.Zone as Zone_Name
      FROM Exhibit_Activity ea
      LEFT JOIN Exhibit e ON ea.Exhibit_ID = e.Exhibit_ID
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      WHERE ea.Activity_Order = ?
      ORDER BY ea.Activity_ID
    `,
      [order]
    );

    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities by order:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
};

// Get currently active activities from Config table
export const getActiveActivities = async (req, res) => {
  try {
    // Always compute using the zoo's local timezone to avoid server/DB TZ drift
    // Define helper to get "now" in America/Chicago as a Date with local components
    const getNowInChicago = () => {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const parts = fmt
        .formatToParts(now)
        .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
      const year = parseInt(parts.year, 10);
      const month = parseInt(parts.month, 10);
      const day = parseInt(parts.day, 10);
      const hour = parseInt(parts.hour, 10);
      const minute = parseInt(parts.minute, 10);
      const second = parseInt(parts.second, 10);
      return new Date(year, month - 1, day, hour, minute, second);
    };

    const nowCT = getNowInChicago();
    const startOfYearCT = new Date(nowCT.getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
      (nowCT - startOfYearCT) / (1000 * 60 * 60 * 24)
    );
    const activityOrder = dayOfYear % 2 === 0 ? 1 : 2;

    // debug logs removed

    // Fetch activities for today's order using consistent table casing
    const [allActivities] = await db.query(
      `
      SELECT
        ea.Activity_Name AS activity_name,
        ea.Activity_Description AS activity_description,
        e.exhibit_Name AS exhibit_name,
        COALESCE(l.Zone, '') AS location,
        TIME_FORMAT(e.Display_Time, '%H:%i:%s') AS Display_Time,
        ea.Duration AS duration_minutes,
        COALESCE(e.Enclosure_Type, 'Unknown') AS enclosure_type,
        COALESCE(e.Is_Closed, 0) AS is_closed
      FROM Exhibit_Activity ea
      JOIN Exhibit e ON ea.Exhibit_ID = e.Exhibit_ID
      LEFT JOIN Location l ON e.Location_ID = l.Location_ID
      WHERE ea.Activity_Order = ?
    `,
      [activityOrder]
    );

    // debug logs removed

    const pad2 = (n) => String(n).padStart(2, "0");
    const to12h = (hh, mm) => {
      const h = parseInt(hh, 10);
      const m = pad2(parseInt(mm, 10));
      const isPM = h >= 12;
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${m} ${isPM ? "PM" : "AM"}`;
    };

    // Determine currently active based on Chicago local day/time
    const active = (allActivities || [])
      .filter((a) => {
        if (!a.Display_Time) return false;
        const [hh, mm, ss] = a.Display_Time.split(":");
        const start = new Date(
          nowCT.getFullYear(),
          nowCT.getMonth(),
          nowCT.getDate(),
          parseInt(hh || 0, 10),
          parseInt(mm || 0, 10),
          parseInt(ss || 0, 10)
        );
        const durationMin = parseInt(a.duration_minutes || 0, 10);
        const end = new Date(start.getTime() + durationMin * 60 * 1000);
        const isActive = nowCT >= start && nowCT < end;
        if (isActive) {
          // active item detected (debug logs removed)
        }
        return isActive;
      })
      .map((a) => {
        const [hh, mm] = a.Display_Time.split(":");
        const startLabel = to12h(hh, mm);
        const durationMin = parseInt(a.duration_minutes || 0, 10);
        const startDate = new Date(
          nowCT.getFullYear(),
          nowCT.getMonth(),
          nowCT.getDate(),
          parseInt(hh || 0, 10),
          parseInt(mm || 0, 10),
          0
        );
        const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
        const endLabel = to12h(
          pad2(endDate.getHours()),
          pad2(endDate.getMinutes())
        );

        return {
          activity_name: a.activity_name,
          activity_description: a.activity_description,
          exhibit_name: a.exhibit_name,
          location: a.location,
          start_time: startLabel,
          end_time: endLabel,
          duration_minutes: durationMin,
          enclosure_type: a.enclosure_type,
          is_closed: a.is_closed,
        };
      });

    // debug logs removed
    return res.json(active);
  } catch (error) {
    console.error("Error fetching active activities:", error);
    res.status(500).json({ error: "Failed to fetch active activities" });
  }
};

export const getAllAnimals = async (req, res) => {
  try {
    const [animals] = await db.query(`
      SELECT 
        a.*,
        e.exhibit_Name as Enclosure_Name,
        e.Enclosure_Type
      FROM Animal a
      LEFT JOIN exhibit e ON a.Enclosure_ID = e.Exhibit_ID
      ORDER BY a.Animal_Name
    `);
    res.json(animals);
  } catch (error) {
    console.error("Error fetching animals:", error);
    res.status(500).json({ error: "Failed to fetch animals" });
  }
};

export const getAllExhibitsForAnimals = async (req, res) => {
  try {
    const [exhibits] = await db.query(`
      SELECT 
        Exhibit_ID as Enclosure_ID,
        exhibit_Name as Enclosure_Name,
        Enclosure_Type
      FROM exhibit
      ORDER BY exhibit_Name
    `);
    res.json(exhibits);
  } catch (error) {
    console.error("Error fetching exhibits for animals:", error);
    res.status(500).json({ error: "Failed to fetch exhibits for animals" });
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

    // Get purchase info with membership details
    const [purchases] = await db.query(
      `
      SELECT 
        p.Purchase_ID,
        p.Customer_ID,
        p.Purchase_Date,
        CAST(p.Total_Amount AS DECIMAL(10,2)) as Total_Amount,
        p.Payment_Method,
        p.Membership_ID,
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

    // Check if this is a membership purchase
    let membershipDetails = null;
    if (purchase.Membership_ID) {
      const [membership] = await db.query(
        `
        SELECT 
          Membership_ID,
          Customer_ID,
          CAST(Price AS DECIMAL(10,2)) as Price,
          Start_Date,
          End_Date,
          Membership_Status
        FROM Membership
        WHERE Membership_ID = ?
      `,
        [purchase.Membership_ID]
      );

      if (membership.length > 0) {
        membershipDetails = {
          ...membership[0],
          Price: parseFloat(membership[0].Price),
          Start_Date: formatDateForResponse(membership[0].Start_Date),
          End_Date: formatDateForResponse(membership[0].End_Date),
        };
      }
    }

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
      membership: membershipDetails,
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
    let membershipId = null;
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
        membershipId = existingMembership[0].Membership_ID;
        await connection.query(
          `
          UPDATE Membership
          SET Membership_Status = 'Active',
              End_Date = ?,
              Price = ?
          WHERE Customer_ID = ?
        `,
          [endDate, membershipPrice, customerId]
        );
      } else {
        // Create new membership with authoritative price
        const [membershipResult] = await connection.query(
          `
          INSERT INTO Membership (Customer_ID, Membership_Status, Start_Date, End_Date, Price)
          VALUES (?, 'Active', ?, ?, ?)
        `,
          [customerId, startDate, endDate, membershipPrice]
        );
        membershipId = membershipResult.insertId;
      }

      // Link this purchase to the membership
      await connection.query(
        `UPDATE Purchase SET Membership_ID = ? WHERE Purchase_ID = ?`,
        [membershipId, purchaseId]
      );
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
