const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

// Debug logs to check if the values are being loaded properly
console.log("📦 MySQL Configuration:");
console.table({
  HOST: process.env.DB_HOST,
  PORT: process.env.DB_PORT,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD ? "✅ Loaded" : "❌ Not Loaded",
  DATABASE: process.env.DB_NAME,
});

// Create DB connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 20000,  // Increased timeout to 20 seconds
});

// Attempt connection
db.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:");
    console.error("Host:", process.env.DB_HOST);
    console.error("Database:", process.env.DB_NAME);
    console.error("Error Message:", err.message || err);
    return;
  }
  console.log("✅ Connected to MySQL successfully");
});

module.exports = db;