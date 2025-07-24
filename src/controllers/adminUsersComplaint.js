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

       
        const selectedDepartment = req.query.department;
let complaintQuery = "SELECT * FROM usercomplaint";
let queryParams = [];

if (isAdmin) {
  // Admin can filter complaints by department
  if (selectedDepartment) {
    complaintQuery += " WHERE department = ?";
    queryParams.push(selectedDepartment);
  }

  // Directly query and render
  db.query(complaintQuery, queryParams, (err, results) => {
    if (err) return res.status(500).send("DB error (Admin)");
    renderComplaintPage(results, selectedDepartment);
  });

} else if (isteam) {
  // Get team member's department
  const teamDeptSql = "SELECT department FROM users WHERE id = ?";
  db.query(teamDeptSql, [userId], (err, teamResult) => {
    if (err) return res.status(500).send("DB error (Team Dept)");
    if (teamResult.length === 0) return res.status(404).send("Team user not found");

    const dept = teamResult[0].department;
    const teamQuery = "SELECT * FROM usercomplaint WHERE department = ?";

    db.query(teamQuery, [dept], (err, results) => {
      if (err) return res.status(500).send("DB error (Team Complaints)");
      renderComplaintPage(results, dept);
    });
  });

} else {
  // Regular user: only own complaints
  complaintQuery += " WHERE user_id = ?";
  queryParams.push(userId);

  db.query(complaintQuery, queryParams, (err, results) => {
    if (err) return res.status(500).send("DB error (User)");
    renderComplaintPage(results);
  });
}

// Render Page
function renderComplaintPage(results, dept) {
  const successMsg = req.flash("success");

  res.render("AdminComplaint/AdminComplaint", {
    user: results,
    selectedDepartment: dept || selectedDepartment,
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
}


        });
      });
    });
  });
};

// Update AdminUsers Complaint
exports.UpdateAllComplaints = (req, res) => {
  if (!['admin', 'Team'].includes(req.session.role)) {
    return res.status(403).send("Access Denied");
  }

  const complaintId = req.params.id;
  const { status, teamName, equipment } = req.body;
  // ...rest of your code


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
  if (!['admin', 'Team'].includes(req.session.role)) {
    return res.status(403).send("Access Denied");
  }

  const userId = req.params.id;
  // ...rest of your code

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
