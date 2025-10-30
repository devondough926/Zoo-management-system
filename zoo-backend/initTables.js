import db from "./config/database.js";

const createTables = async () => {
  try {
    // Veterinarians table
    await db.query(`
      CREATE TABLE IF NOT EXISTS veterinarians (
        vet_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        specialty VARCHAR(100),
        phone VARCHAR(40),
        email VARCHAR(120),
        hired_date DATE,
        active TINYINT DEFAULT 1
      );
    `);
    console.log("✅ veterinarians table created");

    // Zookeepers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS zookeepers (
        keeper_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        shift ENUM('Morning','Afternoon','Night') DEFAULT 'Morning',
        phone VARCHAR(40),
        email VARCHAR(120),
        assigned_area VARCHAR(120),
        active TINYINT DEFAULT 1
      );
    `);
    console.log("✅ zookeepers table created");

    // Gifts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS gifts (
        gift_id INT AUTO_INCREMENT PRIMARY KEY,
        item_name VARCHAR(120) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity_available INT NOT NULL DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ gifts table created");

    // Food table
    await db.query(`
      CREATE TABLE IF NOT EXISTS food (
        food_id INT AUTO_INCREMENT PRIMARY KEY,
        item_name VARCHAR(120) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity_available INT NOT NULL DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ food table created");

    console.log("\n🎉 All tables created successfully in Azure MySQL!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
    process.exit(1);
  }
};

createTables();
