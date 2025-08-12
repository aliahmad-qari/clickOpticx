const db = require("../config/db");

// Middleware to fetch navbar data for all pages
const fetchNavbarData = (req, res, next) => {
  // Query navbar data from database
  const navbarSql = "SELECT * FROM nav_table LIMIT 1";
  
  db.query(navbarSql, (err, bg_result) => {
    if (err) {
      console.error("❌ Error fetching navbar data:", err);
      // Set default values if query fails
      res.locals.navImg = null;
      res.locals.bg_result = [];
    } else {
      // Set navbar data in res.locals (available in all templates)
      res.locals.navImg = bg_result[0]?.nav_imgs || null;
      res.locals.bg_result = bg_result;
    }
    
    next();
  });
};

module.exports = { fetchNavbarData };