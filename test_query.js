const mysql = require("mysql2");
require("dotenv").config();

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("❌ DB Connection Error:", err.message);
    return;
  }
  console.log("✅ Connected to MySQL (Callback Mode)");

  // SQL Query
  const sql = `
    SELECT p.username, u.Username, u.Email, p.package_name as plan, p.user_id as id
    FROM payments p
    LEFT JOIN users u ON p.user_id = u.id 
    WHERE u.role = 'user' AND p.created_at = (
      SELECT MAX(p2.created_at) 
      FROM payments p2 
      WHERE p2.user_id = p.user_id
    )
    LIMIT 3
  `;

  // Run Query
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Query Error:", err.message);
      return;
    }

    console.log("✅ Query Result:");
    console.log(JSON.stringify(results, null, 2));

    // Close DB
    db.end((err) => {
      if (err) console.error("❌ Error closing DB:", err.message);
      else console.log("✅ DB connection closed (Callback Mode)");
    });
  });
});
