const db = require("../../config/db");
const sql = require("../../models/users");
const bcrypt = require("bcrypt");

// Select all AdminUsers
exports.AddUser = (req, res) => {
  const userId = req.session.userId;
  const sql = `
      SELECT Username, Email, Number, plan, password, role, expiry, id 
      FROM users 
      WHERE role = 'user'
    `;

  const backgroundSql = "SELECT * FROM nav_table";

  // âœ… Total notifications count (used in badge)
  const NotifactionSql = `
      SELECT COUNT(*) AS totalNotifactions 
      FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY
    `;

  // âœ… Only unread notifications from the last 2 days
  const passwordSql = `
      SELECT * FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY 
      ORDER BY id DESC
    `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      db.query(NotifactionSql, (err, NotifactionResult) => {
        if (err) {
          console.error("Error fetching total notifications:", err);
          return res.status(500).send("Database error");
        }

        const totalNotifactions = NotifactionResult[0].totalNotifactions;

        db.query(passwordSql, (err, password_datass) => {
          if (err) {
            console.error("Database query error (Notifications):", err);
            return res.status(500).send("Internal Server Error");
          }
          // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
          const notifications_users = `
                        SELECT COUNT(*) AS Notifactions 
                        FROM notifications_user 
                        WHERE user_id = ?
                      `;

          db.query(notifications_users, [userId], (err, Notifaction) => {
            if (err) {
              console.error("Error fetching user notifications count:", err);
              return res.status(500).send("Database error");
            }

            const Notifactions = Notifaction[0].Notifactions;

            const passwordSql = `
                    SELECT * FROM notifications_user 
                    WHERE user_id = ? 
                    AND is_read = 0 
                    AND created_at >= NOW() - INTERVAL 2 DAY 
                    ORDER BY id DESC;
                  `;
            db.query(passwordSql, [userId], (err, notifications_users) => {
              if (err) {
                console.error("Error fetching notification details:", err);
                return res.status(500).send("Server Error");
              }

              const PackageSQL = `SELECT DISTINCT package_name FROM payments ORDER BY package_name`;
              db.query(PackageSQL, (err, Package_results) => {
                if (err) {
                  console.error("Package query error:", err);
                  Package_results = []; // Use empty array as fallback
                }

                const successMsg = req.flash("success");

                const isAdmin = "admin";
                const isUser =
                  req.session.user && req.session.user.role === "user";

                res.render("AddUsers/AddUser", {
                  user: results,
                  message: null,
                  isAdmin,
                  bg_result,
                  totalNotifactions,
                  password_datass,
                  messages: {
                    success: successMsg.length > 0 ? successMsg[0] : null,
                  },
                  isUser,
                  notifications_users,
                  Notifactions,
                  Package_results,
                });
              });
            });
          });
        });
      });
    });
  });
};

// Add User // Add User
exports.AllUser = (req, res) => {
  const { Username, Email, password, role, Number, plan, expiry } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.status(500).send("Internal Server Error");
    }

    // Admin-created users are automatically verified
    const sql = `
        INSERT INTO users (Username, Email, password, Number, role, plan, expiry, user_verified, verification_token) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

    db.query(
      sql,
      [Username, Email, hashedPassword, Number, role, plan, expiry, 1, null],
      (err, result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }

        req.flash("success", `User "${Username}" added successfully and is ready to login!`);
        res.redirect("/AdminUser");
      }
    );
  });
};

// Add User // Add User
