const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Check if the user is authenticated (Session-based)
function isAuthenticated(req, res, next) {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect("/");
  }

  next();
}

// Check if the user is an admin
function isAdmin(req, res, next) {
  const userId = req.session.userId;

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
  const userId = req.session.userId;

  const sql = "SELECT role FROM users WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err || result.length === 0 || result[0].role !== "Team") {
      return res.redirect("/UserComplaint");
    }
    next();
  });
}

module.exports = { isAuthenticated, isAdmin, isteam };
