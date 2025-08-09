const db = require("../../config/db");
const bcrypt = require("bcrypt");

exports.Allstaff = (req, res) => {
  const userId = req.session.userId;
  
  // Use proper async/await pattern for better error handling
  const getUserData = () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT Username, Email, Number, plan, password, role, expiry, id FROM users WHERE role = 'Team'`;
      db.query(sql, (err, results) => {
        if (err) {
          console.error("Team users query error:", err);
          resolve([]); // Return empty array instead of failing
        } else {
          resolve(results || []);
        }
      });
    });
  };

  const getBackgroundData = () => {
    return new Promise((resolve, reject) => {
      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, results) => {
        if (err) {
          console.error("Background query error:", err);
          resolve([{ background_color: '#ffffff', text_color: '#000000' }]);
        } else {
          resolve(results || []);
        }
      });
    });
  };

  const getNotificationData = () => {
    return new Promise((resolve, reject) => {
      const NotifactionSql = `SELECT COUNT(*) AS totalNotifactions FROM notifications WHERE is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY`;
      db.query(NotifactionSql, (err, results) => {
        if (err) {
          console.error("Notification count error:", err);
          resolve(0);
        } else {
          resolve(results[0]?.totalNotifactions || 0);
        }
      });
    });
  };

  const getNotificationDetails = () => {
    return new Promise((resolve, reject) => {
      const passwordSql = `SELECT * FROM notifications WHERE is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY ORDER BY id DESC`;
      db.query(passwordSql, (err, results) => {
        if (err) {
          console.error("Notification details error:", err);
          resolve([]);
        } else {
          resolve(results || []);
        }
      });
    });
  };

  const getUserNotifications = () => {
    return new Promise((resolve, reject) => {
      if (!userId) {
        resolve({ count: 0, notifications: [] });
        return;
      }
      
      const countSql = `SELECT COUNT(*) AS Notifactions FROM notifications_user WHERE user_id = ?`;
      db.query(countSql, [userId], (err, countResult) => {
        if (err) {
          console.error("User notification count error:", err);
          resolve({ count: 0, notifications: [] });
          return;
        }

        const detailSql = `SELECT * FROM notifications_user WHERE user_id = ? AND is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY ORDER BY id DESC`;
        db.query(detailSql, [userId], (err, detailResult) => {
          if (err) {
            console.error("User notification details error:", err);
            resolve({ count: countResult[0]?.Notifactions || 0, notifications: [] });
          } else {
            resolve({ 
              count: countResult[0]?.Notifactions || 0, 
              notifications: detailResult || [] 
            });
          }
        });
      });
    });
  };

  // Execute all queries with proper error handling
  Promise.all([
    getUserData(),
    getBackgroundData(),
    getNotificationData(),
    getNotificationDetails(),
    getUserNotifications()
  ]).then(([user, bg_result, totalNotifactions, password_datass, userNotifs]) => {
    
    const successMsg = req.flash("success");
    
    // Render with all required data
    res.render("AddTeam/AddTeam", {
      user: user,
      message: null,
      isAdmin: true,
      bg_result: bg_result,
      totalNotifactions: totalNotifactions,
      password_datass: password_datass,
      messages: {
        success: successMsg.length > 0 ? successMsg[0] : null,
      },
      isUser: false,
      notifications_users: userNotifs.notifications,
      Notifactions: userNotifs.count,
      Package_results: [], // Not needed for add team form
    });
    
  }).catch(error => {
    console.error("Controller error:", error);
    res.status(500).json({ 
      error: "Server error", 
      details: error.message 
    });
  });
};

// Insert all AdminTeams
exports.AddTeam = (req, res) => {
  const { Username, Email, password, role, Number, department } = req.body;

  const formattedDepartment = department
    ? department.charAt(0).toUpperCase() + department.slice(1).toLowerCase()
    : null;

  // Hash the password before storing it
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.status(500).send("Internal Server Error");
    }
    // Admin-created team members are automatically verified
    const sql =
      "INSERT INTO users (Username, Email, password, Number, role, department, user_verified, verification_token) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(
      sql,
      [Username, Email, hashedPassword, Number, role, formattedDepartment, 1, null],
      (err, result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }
        req.flash("success", `Team member "${Username}" added successfully and is ready to login!`);
        res.redirect("/AdminTeam");
      }
    );
  });
};
