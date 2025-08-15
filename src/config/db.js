const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

// Debug logs
console.log("📦 MySQL Configuration:");
console.log("HOST:", process.env.MYSQLHOST);
console.log("PORT:", process.env.MYSQLPORT);
console.log("USER:", process.env.MYSQLUSER);
console.log("PASSWORD:", process.env.MYSQLPASSWORD ? '✅ Loaded' : '❌ Not Loaded');
console.log("DATABASE:", process.env.MYSQL_DATABASE);

// Create DB connection
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQL_DATABASE,
});

// Attempt connection
db.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:");
    console.error(err.message || err);
    return;
  }
  console.log("✅ Connected to MySQL successfully");
});

module.exports = db;
