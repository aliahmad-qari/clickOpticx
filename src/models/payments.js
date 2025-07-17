const connection = require("../config/db");

const sql = `CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    amount decimal(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;

connection.query(sql, function (err, result) {
  if (err) throw err;
  console.log("User table created payments");
});

module.exports = sql;
