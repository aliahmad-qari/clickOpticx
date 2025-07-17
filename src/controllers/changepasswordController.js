const db = require("../config/db");

exports.profile = (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }

  const sqlProfile = "SELECT * FROM users WHERE id = ?";
  db.query(sqlProfile, [userId], (err, userResults) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (userResults.length === 0) {
      return res.status(404).send("User not found");
    }

    const backgroundSql = "SELECT * FROM nav_table";
    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      const dataSql = "SELECT * FROM data_entries";
      db.query(dataSql, (err, password_data) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }
        // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
        const notifications_users_count_sql = `
        SELECT COUNT(*) AS Notifactions 
        FROM notifications_user 
        WHERE user_id = ? AND is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY
      `;

        db.query(
          notifications_users_count_sql,
          [userId],
          (err, Notifaction) => {
            if (err) {
              console.error("Error fetching user notifications count:", err);
              return res.status(500).send("Database error");
            }

            const Notifactions = Notifaction[0].Notifactions;

            const notifications_details_sql = `
          SELECT * FROM notifications_user 
          WHERE user_id = ? 
          AND is_read = 0 
          AND created_at >= NOW() - INTERVAL 2 DAY 
          ORDER BY id DESC
        `;

            db.query(
              notifications_details_sql,
              [userId],
              (err, notifications_users) => {
                if (err) {
                  console.error("Error fetching notification details:", err);
                  return res.status(500).send("Server Error");
                }
                // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh

                const isAdmin = userResults[0].role === "admin";
                const isUser = userResults[0].role === "user";

                // ssssssssss
                const NotifactionSql =
                  "SELECT COUNT(*) AS totalNotifactions FROM notifications";
                db.query(NotifactionSql, (err, NotifactionResult) => {
                  if (err) {
                    console.error("Error fetching total complaints:", err);
                    return res.status(500).send("Database error");
                  }
                  // ssssssss
                  const totalNotifactions =
                    NotifactionResult[0].totalNotifactions;

                  // 👇 Flash messages here
                  const successMsg = req.flash("success");

                  res.render("Changepassword/changepassword", {
                    user: userResults[0],
                    isAdmin,
                    password_data,
                    bg_result,
                    totalNotifactions,
                    messages: {
                      success: successMsg.length > 0 ? successMsg[0] : null,
                    },
                    isUser,
                    notifications_users,
                    Notifactions,
                  });
                });
              }
            );
          }
        );
      });
    });
  });
};

// sssssss
exports.password = (req, res) => {
  const { username, field1, field2 } = req.body;
  const message = "Request for change password.";
  const is_read = 0;

  // 1. Insert form data into data_entries
  const sqlData = `
    INSERT INTO data_entries (username, field1, field2)
    VALUES (?, ?, ?)
  `;

  db.query(sqlData, [username, field1, field2], (err, result) => {
    if (err) {
      console.error("❌ SQL Error (data_entries):", err);
      req.flash("error", "Error saving to data_entries table.");
      return res.redirect("/changepassword");
    }

    // 2. Insert message into notifications table
    const sqlNotif = `
      INSERT INTO notifications (username, message, field2,is_read)
      VALUES (?, ?, ?,?)
    `;

    db.query(
      sqlNotif,
      [username, message, field2, is_read],
      (err, notifResult) => {
        if (err) {
          console.error("❌ SQL Error (notifications):", err);
          req.flash("error", "Error saving to notifications table.");
          return res.redirect("/changepassword");
        }

        req.flash("success", "Request has been submitted");
        res.redirect("/changepassword");
      }
    );
  });
};
