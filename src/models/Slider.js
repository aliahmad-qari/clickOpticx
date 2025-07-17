const connection = require("../config/db");

const sql = `CREATE TABLE IF NOT EXISTS slider (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Slider_1 VARCHAR(255) NOT NULL,
  Slider_2 VARCHAR(255) NOT NULL
)`;

connection.query(sql, function (err, result) {
  if (err) throw err;
  console.log("User table created Main Slider");
});

module.exports = sql;
