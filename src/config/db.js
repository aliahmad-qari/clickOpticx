// const mysql = require("mysql2");
// const dotenv = require("dotenv");
// dotenv.config();

// // Debug logs
// console.log("📦 MySQL Configuration:");
// console.log("HOST:", process.env.MYSQLHOST);
// console.log("PORT:", process.env.MYSQLPORT);
// console.log("USER:", process.env.MYSQLUSER);
// console.log(
//   "PASSWORD:",
//   process.env.MYSQLPASSWORD ? "✅ Loaded" : "❌ Not Loaded"
// );
// console.log("DATABASE:", process.env.MYSQL_DATABASE);

// // Create DB connection
// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   port: Number(process.env.DB_PORT),
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// // Attempt connection
// db.connect((err) => {
//   if (err) {
//     console.error("❌ Error connecting to MySQL:");
//     console.error(err.message || err);
//     return;
//   }
//   console.log("✅ Connected to MySQL successfully");
// });

// module.exports = db;
const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

// Debug logs
console.log("📦 MySQL Configuration:");
console.log("HOST:", process.env.DB_HOST);
console.log("PORT:", process.env.DB_PORT);
console.log("USER:", process.env.DB_USER);
console.log("PASSWORD:", process.env.DB_PASSWORD ? '✅ Loaded' : '❌ Not Loaded');
console.log("DATABASE:", process.env.DB_NAME);

// Create DB connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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

module.exports = db;