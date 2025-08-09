const connection = require("../config/db");

const sql = `CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Package VARCHAR(255) NOT NULL,
  Price int(11) NOT NULL,
  Speed VARCHAR(255) NOT NULL,
  Data_Used VARCHAR(255) NOT NULL,
  Offer_Valid VARCHAR(255) NOT NULL,
  limits VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  discountPercentage decimal(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

connection.query(sql, function (err, result) {
  if (err) throw err;
  console.log("User table created packages");
});

module.exports = sql;
