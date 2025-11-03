import db from "../config/database.js";

// ============================================
// CUSTOMER AUTHENTICATION
// ============================================

// Register a new customer
export const registerCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    // Check if email already exists
    const [existingCustomers] = await db.query(
      "SELECT Customer_ID FROM Customer WHERE Email = ?",
      [email]
    );

    if (existingCustomers.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Insert new customer
    const [result] = await db.query(
      `INSERT INTO Customer (First_Name, Last_Name, Email, Customer_Password, Phone)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email, password, phone || null]
    );

    // Fetch the newly created customer
    const [newCustomer] = await db.query(
      `SELECT Customer_ID, First_Name, Last_Name, Email, Phone
       FROM Customer WHERE Customer_ID = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Customer registered successfully",
      customer: newCustomer[0],
    });
  } catch (error) {
    console.error("Error registering customer:", error);
    console.error("Error details:", error.message);
    console.error("SQL Error:", error.sqlMessage);
    res.status(500).json({
      error: "Failed to register customer",
      details: error.sqlMessage || error.message,
    });
  }
};

// Login customer
export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find customer by email
    const [customers] = await db.query(
      `SELECT Customer_ID, First_Name, Last_Name, Email, Customer_Password, Phone
       FROM Customer WHERE Email = ?`,
      [email]
    );

    if (customers.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const customer = customers[0];

    // Check password (in production, this should use bcrypt)
    if (customer.Customer_Password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Keep password in response for customer dashboard display

    res.json({
      message: "Login successful",
      customer,
    });
  } catch (error) {
    console.error("Error logging in customer:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

// Get customer profile
export const getCustomerProfile = async (req, res) => {
  try {
    const { customerId } = req.params;

    const [customers] = await db.query(
      `SELECT Customer_ID, First_Name, Last_Name, Email, Phone
       FROM Customer WHERE Customer_ID = ?`,
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customers[0]);
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    res.status(500).json({ error: "Failed to fetch customer profile" });
  }
};

// Update customer profile
export const updateCustomerProfile = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { firstName, lastName, email, phone } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res
        .status(400)
        .json({ error: "First name, last name, and email are required" });
    }

    // Check if email is already used by another customer
    const [existingCustomers] = await db.query(
      "SELECT Customer_ID FROM Customer WHERE Email = ? AND Customer_ID != ?",
      [email, customerId]
    );

    if (existingCustomers.length > 0) {
      return res
        .status(409)
        .json({ error: "Email already in use by another account" });
    }

    // Update customer
    await db.query(
      `UPDATE Customer 
       SET First_Name = ?, Last_Name = ?, Email = ?, Phone = ?
       WHERE Customer_ID = ?`,
      [firstName, lastName, email, phone || null, customerId]
    );

    // Fetch updated customer
    const [updatedCustomer] = await db.query(
      `SELECT Customer_ID, First_Name, Last_Name, Email, Phone
       FROM Customer WHERE Customer_ID = ?`,
      [customerId]
    );

    res.json({
      message: "Profile updated successfully",
      customer: updatedCustomer[0],
    });
  } catch (error) {
    console.error("Error updating customer profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Change customer password
export const changeCustomerPassword = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { newPassword } = req.body;

    // Validate required fields
    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    // Check if customer exists
    const [customers] = await db.query(
      "SELECT Customer_ID FROM Customer WHERE Customer_ID = ?",
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Update password
    await db.query(
      "UPDATE Customer SET Customer_Password = ? WHERE Customer_ID = ?",
      [newPassword, customerId]
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// ============================================
// EMPLOYEE AUTHENTICATION
// ============================================

// Login employee (staff/admin)
// Staff login is role-based using Job_Title table only
export const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find job title by email (role-based login only)
    const [jobTitles] = await db.query(
      `SELECT 
        Job_ID,
        Title,
        Description as Job_Description,
        Email,
        Account_Password
       FROM Job_Title
       WHERE Email = ?`,
      [email]
    );

    if (jobTitles.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const jobTitle = jobTitles[0];

    // Check password
    if (jobTitle.Account_Password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create employee object for job title login
    const employee = {
      Employee_ID: null, // No specific employee, role-based access
      First_Name: jobTitle.Title,
      Last_Name: "Staff",
      Email: jobTitle.Email,
      Job_ID: jobTitle.Job_ID,
      Title: jobTitle.Title,
      Job_Description: jobTitle.Job_Description,
    };

    // Determine role based on job title
    let role = "employee";
    const title = jobTitle.Title.toLowerCase();

    if (title.includes("administrator") || title.includes("admin")) {
      role = "admin";
    } else if (title.includes("supervisor") || title.includes("manager")) {
      role = "supervisor";
    } else if (title.includes("veterinarian")) {
      role = "veterinarian";
    } else if (title.includes("zookeeper") || title.includes("keeper")) {
      role = "zookeeper";
    } else if (title.includes("gift") || title.includes("shop")) {
      role = "giftshop";
    } else if (title.includes("concession") || title.includes("food")) {
      role = "concession";
    }

    res.json({
      message: "Login successful",
      employee,
      role,
    });
  } catch (error) {
    console.error("Error logging in employee:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

// Get employee profile
export const getEmployeeProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const [employees] = await db.query(
      `SELECT 
        e.Employee_ID, 
        e.First_Name, 
        e.Last_Name, 
        e.Email,
        e.Job_ID,
        e.Salary,
        e.Address,
        DATE_FORMAT(e.Birthdate, '%Y-%m-%d') as Birthdate,
        e.Sex,
        jt.Title,
        jt.Description as Job_Description
       FROM Employee e
       LEFT JOIN Job_Title jt ON e.Job_ID = jt.Job_ID
       WHERE e.Employee_ID = ?`,
      [employeeId]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(employees[0]);
  } catch (error) {
    console.error("Error fetching employee profile:", error);
    res.status(500).json({ error: "Failed to fetch employee profile" });
  }
};
