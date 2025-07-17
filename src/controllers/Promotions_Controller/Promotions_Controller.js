const db = require("../../config/db");
const sql = require("../../models/users");

exports.Promotions = (req, res) => {
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
              // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh

              const promotion =
                "SELECT * FROM promotions ORDER BY id DESC LIMIT 1";
              db.query(promotion, (err, promotionresult) => {
                if (err) {
                  console.error("Database query error:", err);
                  return res.status(500).send("Internal Server Error");
                }
                // ðŸ‘‡ Flash messages here
                const successMsg = req.flash("success");

                const isAdmin = "admin";
                const isUser =
                  req.session.user && req.session.user.role === "user";

                res.render("Notification/Promotions", {
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
                  promotionresult,
                });
              });
            });
          });
        });
      });
    });
  });
};

exports.InsertPromotions = async (req, res) => {
  try {
    const { link } = req.body;

    if (!req.file) {
      req.flash("error", "No file uploaded!");
      return res.redirect("/Promotions");
    }

    const promot = req.file.filename;
    const sql =
      "INSERT INTO promotions (img1, link, created_at) VALUES (?, ?, NOW())";

    db.query(sql, [promot, link], (err, result) => {
      if (err) {
        console.error(err);
        req.flash("error", "An error occurred while inserting the promotion!");
        return res.redirect("/Promotions");
      }

      req.flash("success", "Promotion added successfully!");
      res.redirect("/Promotions");
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Unexpected error occurred!");
    res.redirect("/Promotions");
  }
};
