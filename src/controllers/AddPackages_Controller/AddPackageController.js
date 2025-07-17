const db = require("../../config/db");
const sql = require("../../models/users");

// Select all AdminUsers
exports.AddPackages = (req, res) => {
  const userId = req.session.userId;
  const sql = `
      SELECT * FROM users 
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

              // ðŸ‘‡ Flash messages here
              const successMsg = req.flash("success");

              const isAdmin = "admin";
              const isUser =
                req.session.user && req.session.user.role === "user";

              res.render("package/AddPackage", {
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

// GET package // GET package

exports.insertPackage = (req, res) => {
  const { Package, Price, Speed, Data_Used, Offer_Valid, limits } = req.body;

  const sql = `INSERT INTO packages (Package,Price,Speed,Data_Used,Offer_Valid,limits,user_id) VALUES ( ?, ?, ?, ?, ? ,? ,?)`;
  db.query(
    sql,
    [Package, Price, Speed, Data_Used, Offer_Valid, limits, req.session.userId],
    (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }
      req.flash("success", "Your package add successfully!");
      res.redirect("/AddPackages");
    }
  );
};
// INSERT ONALY ADMIN // INSERT ONALY ADMIN
