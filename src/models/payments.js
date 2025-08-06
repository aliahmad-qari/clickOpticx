const connection = require("../config/db");

const sql = `CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    amount decimal(10,2) NOT NULL,
    discount decimal(10,2) DEFAULT 0,
    custom_amount decimal(10,2) DEFAULT 0,
    remaining_amount decimal(10,2) DEFAULT 0,
    package_status VARCHAR(50) DEFAULT 'pending',
    invoice_status VARCHAR(50) DEFAULT 'Unpaid',
    home_collection VARCHAR(10) DEFAULT 'no',
    collection_address TEXT NULL,
    contact_number VARCHAR(20) NULL,
    preferred_time VARCHAR(50) NULL,
    special_instructions TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;

connection.query(sql, function (err, result) {
  if (err) throw err;
  console.log("User table created payments");
});

module.exports = sql;
