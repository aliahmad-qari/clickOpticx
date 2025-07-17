const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Check if the user is authenticated (JWT token is valid)
function isAuthenticated(req, res, next) {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.redirect("/");
  }

  // Verify JWT token
  jwt.verify(token, "your_jwt_secret", (err, decoded) => {
    if (err) {
      return res.redirect("/");
    }
    req.userId = decoded.id;
    next();
  });
}

// Check if the user is an admin
function isAdmin(req, res, next) {
  const userId = req.userId;

  const sql = "SELECT role FROM users WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err || result.length === 0 || result[0].role !== "admin") {
      return res.redirect("/index");
    }
    next();
  });
}

// Check if the user is an Team
function isteam(req, res, next) {
  const userId = req.userId;

  const sql = "SELECT role FROM users WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err || result.length === 0 || result[0].role !== "Team") {
      return res.redirect("/UserComplaint");
    }
    next();
  });
}

module.exports = { isAuthenticated, isAdmin, isteam };
