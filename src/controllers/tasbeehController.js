const db = require("../config/db");


// Get Profile Controller
exports.profile = (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }
  
  const sqlProfile =
    "SELECT Username, Email, plan, invoice, transaction_id, user_img, amount FROM users WHERE id = ?";
  db.query(sqlProfile, [userId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    const query = "SELECT COUNT(*) AS count FROM payments";
    db.query(query, (err, paymentResult) => {
      if (err) {
        console.error("Error fetching payment count:", err);
        return res.status(500).send("Database error");
      }

      const paymentCount = paymentResult[0].count;

      const isAdmin = results.length > 0 ? results[0].role === "admin" : false;
      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, bg_result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }
        
        const isUser = req.session.user && req.session.user.role === "user";

        // ✅ New: Total unread notifications in the past 2 days
        const NotifactionSql = `
          SELECT COUNT(*) AS totalNotifactions 
          FROM notifications 
          WHERE is_read = 0 
          AND created_at >= NOW() - INTERVAL 2 DAY
        `;
        db.query(NotifactionSql, (err, NotifactionResult) => {
          if (err) {
            console.error("Error fetching notification count:", err);
            return res.status(500).send("Server Error");
          }

          const totalNotifactions = NotifactionResult[0].totalNotifactions;

          // ✅ New: Detailed unread notifications
          const passwordSql = `
            SELECT * FROM notifications 
            WHERE is_read = 0 
            AND created_at >= NOW() - INTERVAL 2 DAY 
            ORDER BY id DESC
          `;
          db.query(passwordSql, (err, password_datass) => {
            if (err) {
              console.error("Error fetching notification details:", err);
              return res.status(500).send("Server Error");
            }

            // 👇 Flash messages here
            const successMsg = req.flash("success");

            // Get user-specific notifications for users
            const userNotifSql = `
              SELECT * FROM notifications 
              WHERE is_read = 0 
              AND created_at >= NOW() - INTERVAL 2 DAY 
              ORDER BY id DESC
            `;
            db.query(userNotifSql, (err, notifications_users) => {
              if (err) {
                console.error("Error fetching user notifications:", err);
                notifications_users = [];
              }

              res.render("Tasbeeh/tasbeeh", {
                user: results,
                message: null,
                isAdmin,
                paymentCount,
                bg_result,
                messages: {
                  success: successMsg.length > 0 ? successMsg[0] : null,
                },
                totalNotifactions,
                password_datass,
                isUser,
                Notifactions: notifications_users.length || 0,
                notifications_users: notifications_users || [],
              });
            });
          });
        });
      });
    });
  });
};