const db = require("../../config/db");
const sql = require("../../models/users");

// Select all AdminUsers
exports.ExpiredUser = (req, res) => {
  const userId = req.session.userId;

  // SQL to fetch expired users based on the package status
  const sql = `
    SELECT 
      p.user_id, 
      u.Username, 
      p.invoice_status AS invoice, 
      p.package_status AS plan, 
      u.user_img,
      p.expiry_date AS expiry,
      MAX(p.created_at) AS latest_payment
    FROM payments p
    JOIN users u ON p.user_id = u.id
    WHERE (p.invoice_status = 'Unpaid' OR p.package_status = 'Expired') 
      AND u.role = 'user'
    GROUP BY p.user_id
    ORDER BY p.expiry_date DESC
  `;

  const backgroundSql = "SELECT * FROM nav_table";

  // Total notifications count (used in badge)
  const NotifactionSql = `
      SELECT COUNT(*) AS totalNotifactions 
      FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY
    `;

  // Only unread notifications from the last 2 days
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

          const notifications_users_sql = `
                        SELECT COUNT(*) AS Notifactions 
                        FROM notifications_user 
                        WHERE user_id = ?
                      `;

          db.query(notifications_users_sql, [userId], (err, Notifaction) => {
            if (err) {
              console.error("Error fetching user notifications count:", err);
              return res.status(500).send("Database error");
            }

            const Notifactions = Notifaction[0].Notifactions;

            const unreadSql = `
              SELECT * FROM notifications_user 
              WHERE user_id = ? 
              AND is_read = 0 
              AND created_at >= NOW() - INTERVAL 2 DAY 
              ORDER BY id DESC;
            `;

            db.query(unreadSql, [userId], (err, notifications_users) => {
              if (err) {
                console.error("Error fetching notification details:", err);
                return res.status(500).send("Server Error");
              }

              // Flash messages here
              const successMsg = req.flash("success");

              const isAdmin = "admin";
              const isUser = req.session.user && req.session.user.role === "user";

              // Render the expired users page
              res.render("AddUsers/ExpiredUser", {
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
              });
            });
          });
        });
      });
    });
  });
};

