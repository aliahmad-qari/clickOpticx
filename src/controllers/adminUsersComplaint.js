const db = require("../config/db");

// Get AdminUsers Complaint
exports.AllComplaints = (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect("/");
  }

  const roleQuery = `SELECT role FROM users WHERE id = ?`;
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

  db.query(roleQuery, [userId], (err, roleResult) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (roleResult.length === 0) {
      return res.redirect("/");
    }

    const isAdmin = roleResult[0].role === "admin";
    const isteam = roleResult[0].role === "Team";
    const isUser = roleResult[0].role === "user";

    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error (Background):", err);
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

          const complaintQuery = "SELECT * FROM usercomplaint";
          const queryParams = isAdmin ? [] : [userId];

          db.query(complaintQuery, queryParams, (err, results) => {
            if (err) {
              console.error("Database query error (Complaints):", err);
              return res.status(500).send("Internal Server Error");
            }
            // 👇 Flash messages here
            const successMsg = req.flash("success");

            res.render("AdminComplaint/AdminComplaint", {
              user: results,
              message: null,
              isAdmin,
              isteam,
              isUser,
              bg_result,
              totalNotifactions,
              password_datass,
              messages: {
                success: successMsg.length > 0 ? successMsg[0] : null,
              },
            });
          });
        });
      });
    });
  });
};

// Update AdminUsers Complaint
exports.UpdateAllComplaints = (req, res) => {
  const complaintId = req.params.id;
  const { status, teamName, equipment } = req.body;

  const updateSql = "UPDATE usercomplaint SET status = ?, teamName = ?, equipment = ? WHERE id = ?";
  db.query(updateSql, [status, teamName, equipment, complaintId], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    // Step 2: Get the user_id of the complaint
    const getUserSql = "SELECT user_id FROM usercomplaint WHERE id = ?";
    db.query(getUserSql, [complaintId], (err, rows) => {
      if (err) {
        console.error("Error fetching user ID:", err);
        return res.status(500).send("Internal Server Error");
      }

      if (rows.length === 0) {
        return res.status(404).send("Complaint not found");
      }

      const userId = rows[0].user_id;
      const message = `Your complaint has been ${status}.`;

      // Step 3: Insert notification for user
      const notifSql = `
        INSERT INTO notifications_user (user_id, message, is_read)
        VALUES (?, ?, 0)
      `;

      db.query(notifSql, [userId, message], (err) => {
        if (err) {
          console.error("❌ SQL Error (notifications_user):", err);
          req.flash("error", "Error saving user notification.");
          return res.redirect("/UserComplaint");
        }

        // Step 4: Notify Admin if teamName and equipment are provided
        if (teamName && equipment) {
          const adminNotifMessage = `1 new equipment (${equipment}) has been reported as faulty by ${teamName}.`;

          const adminNotifSql = `
            INSERT INTO notifications (username, message, is_read)
            VALUES (?, ?, 0)
          `;

          db.query(adminNotifSql, [teamName, adminNotifMessage], (err2) => {
            if (err2) {
              console.error("❌ SQL Error (notifications):", err2);
            }
            req.flash("success", "Complaint updated and notifications sent!");
            res.redirect("/UserComplaint");
          });
        } else {
          req.flash("success", "Complaint updated and user notified.");
          res.redirect("/UserComplaint");
        }
      });
    });
  });
};



// Delete AdminUsers Complaint
exports.DeleteComplaint = (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM usercomplaint WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "Complaint deleted successfully!");
    res.redirect("/UserComplaint");
  });
};
