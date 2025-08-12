const db = require('./src/config/db');

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

db.query(sql, (err, result) => {
  if (err) {
    console.log('Error:', err.message);
  } else {
    console.log('Query result:', JSON.stringify(result, null, 2));
  }
  process.exit();
});