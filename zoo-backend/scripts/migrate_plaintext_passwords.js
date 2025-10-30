import db, { testConnection } from "../config/database.js";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const dryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";

async function main() {
  try {
    console.log("Starting password migration (plaintext -> bcrypt)...");

    // Quick DB connectivity check with helpful message on failure
    const connected = await testConnection();
    if (!connected) {
      console.error(
        "Database connection failed — please check your backend .env and ensure MySQL is running."
      );
      console.error("Required env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT (optional)");
      process.exit(1);
    }

    const [rows] = await db.query(
      "SELECT Customer_ID, Customer_Password FROM Customer"
    );

    if (!rows || rows.length === 0) {
      console.log("No customers found. Exiting.");
      process.exit(0);
    }

    let total = 0;
    let toMigrate = [];

    for (const r of rows) {
      total++;
      const pwd = r.Customer_Password || "";
      // bcrypt hashes begin with $2a$, $2b$ or $2y$
      if (!/^\$2[aby]\$/.test(pwd)) {
        toMigrate.push({ id: r.Customer_ID, current: pwd });
      }
    }

    console.log(`Checked ${total} customers. Found ${toMigrate.length} plaintext passwords.`);

    if (toMigrate.length === 0) {
      console.log("Nothing to migrate.");
      process.exit(0);
    }

    if (dryRun) {
      console.log("Dry run enabled — no updates will be written.");
      toMigrate.forEach((u) => console.log(`Would re-hash Customer_ID=${u.id}`));
      process.exit(0);
    }

    let migrated = 0;
    for (const u of toMigrate) {
      try {
        const newHash = await bcrypt.hash(u.current, SALT_ROUNDS);
        await db.query(
          "UPDATE Customer SET Customer_Password = ? WHERE Customer_ID = ?",
          [newHash, u.id]
        );
        migrated++;
        console.log(`Re-hashed Customer_ID=${u.id}`);
      } catch (err) {
        console.error(`Failed to migrate Customer_ID=${u.id}:`, err.message);
      }
    }

    console.log(`Migration complete. Re-hashed ${migrated} / ${toMigrate.length} accounts.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
