import db from "../config/database.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// Parse a jsonwebtoken-style expiresIn value (number in seconds or string like "1d", "12h", "30m", "45s")
// and return milliseconds for cookie maxAge.
const parseExpiresToMs = (expires) => {
  if (!expires) return 24 * 60 * 60 * 1000; // default 1 day

  // If it's a number (or numeric string), treat as seconds
  if (typeof expires === "number" || /^\d+$/.test(String(expires))) {
    const seconds = Number(expires);
    return seconds * 1000;
  }

  // Match a value like '1d', '12h', '30m', '45s'
  const match = String(expires).match(/^(\d+)\s*([smhd])$/i);
  if (match) {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  // Fallback default: 1 day
  return 24 * 60 * 60 * 1000;
};

// Helper function to generate JWT
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper function to set auth cookie
const setAuthCookie = (res, token) => {
  const maxAgeMs = parseExpiresToMs(JWT_EXPIRES_IN);
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    sameSite: "lax",
    maxAge: maxAgeMs,
  });
};

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

    // Generate JWT token
    const token = generateToken({
      customerId: customer.Customer_ID,
      email: customer.Email,
      type: "customer",
    });

    // Set httpOnly cookie
    setAuthCookie(res, token);

    // Remove password from response
    delete customer.Customer_Password;

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

    // Generate JWT token
    const token = generateToken({
      employeeId: employee.Employee_ID,
      jobId: jobTitle.Job_ID,
      email: jobTitle.Email,
      role: role,
      type: "employee",
    });

    // Set httpOnly cookie
    setAuthCookie(res, token);

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

// Logout - clear auth cookie
export const logout = async (req, res) => {
  try {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
};

// Validate session and return user data
export const validateSession = async (req, res) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(200).json({ user: null });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch fresh user data based on type
    if (decoded.type === "customer") {
      const [customers] = await db.query(
        `SELECT Customer_ID, First_Name, Last_Name, Email, Phone
         FROM Customer WHERE Customer_ID = ?`,
        [decoded.customerId]
      );

      if (customers.length === 0) {
        return res.status(200).json({ user: null });
      }

      return res.json({
        user: customers[0],
        userType: "customer",
        role: null,
      });
    } else if (decoded.type === "employee") {
      // For employee, reconstruct the employee object
      const [jobTitles] = await db.query(
        `SELECT Job_ID, Title, Description, Email
         FROM Job_Title WHERE Job_ID = ?`,
        [decoded.jobId]
      );

      if (jobTitles.length === 0) {
        return res.status(200).json({ user: null });
      }

      const jobTitle = jobTitles[0];
      const employee = {
        Employee_ID: decoded.employeeId,
        First_Name: jobTitle.Title,
        Last_Name: "Staff",
        Email: jobTitle.Email,
        Job_ID: jobTitle.Job_ID,
        Title: jobTitle.Title,
        Job_Description: jobTitle.Description,
      };

      return res.json({
        user: employee,
        userType: "employee",
        role: decoded.role,
      });
    }

    return res.status(200).json({ user: null });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      // Treat invalid/expired token as unauthenticated (don't return 500/401)
      return res.status(200).json({ user: null });
    }
    console.error("Error validating session:", error);
    res.status(500).json({ error: "Failed to validate session" });
  }
};
