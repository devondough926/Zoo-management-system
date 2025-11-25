import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Do not pass an invalid timezone string to mysql2 (it warns/errors).
  // We'll explicitly set the session time_zone on each new connection below.
  // SSL configuration for secure transport
  ssl: {
    rejectUnauthorized: false, // Set to true in production with proper certificates
  },
});

// Ensure each new pooled connection sets the session timezone to the
// requested value (if the server supports named time zones). This preserves
// the behavior of NOW()/timestamps for sessions while avoiding passing an
// unsupported option into the mysql2 connection config (which triggers the
// warning). If the server doesn't have timezone tables loaded, the query may
// fail — we log a non-fatal warning instead of throwing.
const desiredTz = process.env.DB_LOCAL_TZ || "America/Chicago";
pool.on("connection", (connection) => {
  // Use parameterized query to avoid injection and preserve quoting
  connection.query("SET time_zone = ?", [desiredTz], (err) => {
    if (err) {
      console.warn(
        `[DB] Could not set session time_zone to ${desiredTz}: ${err.message}`
      );
    }
  });
});

const promisePool = pool.promise();

const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
};

export { promisePool, testConnection };
export default promisePool;
