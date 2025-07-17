const connection = require("../config/db");

const sql = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    Number INT(11),
    plan VARCHAR(255) NOT NULL,
    role VARCHAR(11) DEFAULT 'user',
    remaining_gb INT(11) NOT NULL,
    invoice VARCHAR(255) DEFAULT 'Unpaid',
    user_img VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    amount VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

connection.query(sql, function (err, result) {
  if (err) throw err;
  console.log("User table created users");
});

module.exports = sql;
