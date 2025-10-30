import db from "../config/database.js";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

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

    // Hash password before storing
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new customer (store hashed password)
    const [result] = await db.query(
      `INSERT INTO Customer (First_Name, Last_Name, Email, Customer_Password, Phone)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hashed, phone || null]
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

    // Check password using bcrypt. For migrating databases that may have
    // plaintext passwords, accept plaintext match and re-hash it to the DB.
    const stored = customer.Customer_Password;
    let passwordMatches = false;

    try {
      passwordMatches = await bcrypt.compare(password, stored);
    } catch (err) {
      // bcrypt.compare might throw if stored is not a valid hash
      passwordMatches = false;
    }

    // Fallback: if stored password matches plaintext (migration case), accept and re-hash
    if (!passwordMatches && stored === password) {
      passwordMatches = true;
      try {
        const newHash = await bcrypt.hash(password, SALT_ROUNDS);
        await db.query("UPDATE Customer SET Customer_Password = ? WHERE Customer_ID = ?", [
          newHash,
          customer.Customer_ID,
        ]);
      } catch (err) {
        console.error("Failed to re-hash migrated plaintext password:", err);
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

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
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password are required" });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    // Fetch current password
    const [customers] = await db.query(
      "SELECT Customer_Password FROM Customer WHERE Customer_ID = ?",
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }


    const stored = customers[0].Customer_Password;

    // Verify current password using bcrypt, but allow plaintext match for migration
    let currentMatches = false;
    try {
      currentMatches = await bcrypt.compare(currentPassword, stored);
    } catch (err) {
      currentMatches = false;
    }

    if (!currentMatches && stored === currentPassword) {
      // Accept plaintext match (migration case)
      currentMatches = true;
    }

    if (!currentMatches) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password and update
    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.query(
      "UPDATE Customer SET Customer_Password = ? WHERE Customer_ID = ?",
      [newHash, customerId]
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
