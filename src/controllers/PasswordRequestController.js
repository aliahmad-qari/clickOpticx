const db = require("../config/db");
const bcrypt = require("bcrypt");

// Get Profile Controller
exports.profile = (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }

  const sqlProfile = "SELECT * FROM users WHERE id = ?";
  const sqlDataEntries = "SELECT * FROM data_entries";
  const backgroundSql = "SELECT * FROM nav_table";

  // ✅ Total notifications count (used in badge)
  const NotifactionSql = `
    SELECT COUNT(*) AS totalNotifactions 
    FROM notifications 
    WHERE is_read = 0 
      AND created_at >= NOW() - INTERVAL 2 DAY
  `;

  // ✅ Only unread notifications from the last 2 days
  const passwordSql = `
    SELECT * FROM notifications 
    WHERE is_read = 0 
      AND created_at >= NOW() - INTERVAL 2 DAY 
    ORDER BY id DESC
  `;

  db.query(sqlProfile, [userId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    const isAdmin = results.length > 0 ? results[0].role === "admin" : false;
    const isUser = results.length > 0 ? results[0].role === "user" : false;

    db.query(sqlDataEntries, (err, dataResults) => {
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

          if (NotifactionResult.length === 0) {
            console.error("No notifications found in the database.");
            return res.status(404).send("Notifications not found");
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

                res.render("PasswordRequest/passwordRequest", {
                  dataEntries: dataResults,
                  user: results,
                  message: null,
                  isAdmin,
                  bg_result,
                  totalNotifactions,
                  password_datass,
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
  });
};

exports.deleteEntry = (req, res) => {
  const { id } = req.params;

  const deleteQuery = "DELETE FROM data_entries WHERE id = ?";

  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error("Error deleting entry:", err);
      return res.status(500).send("Internal Server Error");
    }

    console.log(`Entry with ID ${id} deleted successfully`);
    res.redirect("/passwordRequest");
  });
};
