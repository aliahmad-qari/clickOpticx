const db = require("../config/db");

exports.AllComplaint = (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect("/");
  }

  const sqlProfile = "SELECT * FROM users WHERE id = ?";
  const sqlComplaints =
    "SELECT Username, number, Plane, Complaint, Address, status FROM usercomplaint WHERE user_id = ?";
  const backgroundSql = "SELECT * FROM nav_table";
  const taskQuery = "SELECT * FROM tasks ORDER BY created_at DESC";

  // 👇 Updated: Join to fetch coin_balance for this user
  const dailyTaskQuery = `
    SELECT d.*, u.Username AS user_name 
    FROM daily_tasks d 
    JOIN users u ON u.id = d.user_id 
    WHERE d.user_id = ?
    ORDER BY d.created_at DESC
  `;

  db.query(sqlProfile, [userId], (err, userResults) => {
    if (err) {
      console.error("Database query error (profile):", err);
      return res.status(500).send("Internal Server Error");
    }

    if (userResults.length === 0) {
      return res.status(404).send("User not found");
    }

    db.query(sqlComplaints, [userId], (err, complaintResults) => {
      if (err) {
        console.error("Database query error (complaints):", err);
        return res.status(500).send("Internal Server Error");
      }

      db.query(backgroundSql, (err, bg_result) => {
        if (err) {
          console.error("Database query error (background):", err);
          return res.status(500).send("Internal Server Error");
        }

        db.query(taskQuery, (err, taskResults) => {
          if (err) {
            console.error("Database query error (tasks):", err);
            return res.status(500).send("Internal Server Error");
          }

          db.query(dailyTaskQuery, [userId], (err, dailyTasks) => {
            if (err) {
              console.error("Database query error (daily tasks):", err);
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
                  console.error(
                    "Error fetching user notifications count:",
                    err
                  );
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
                      console.error(
                        "Error fetching notification details:",
                        err
                      );
                      return res.status(500).send("Server Error");
                    }
                    // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh

                    const isAdmin = userResults[0].role === "admin";
                    const isUser = userResults[0].role === "user";

                    res.render("complaint/complaint", {
                      users: complaintResults,
                      user: userResults[0],
                      message: null,
                       messages: req.flash(),
                      bg_result,
                      isAdmin,
                      tasks: taskResults,
                      task: dailyTasks,
                      isUser,
                      notifications_users,
                      Notifactions,
                    });
                  }
                );
              }
            );
          });
        });
      });
    });
  });
};

// Assuming you're using multer middleware as `upload`
exports.uploadTaskImages = (req, res) => {
  const { id, name, title } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  const sql = "INSERT INTO daily_tasks (user_id, user_name, title, image) VALUES (?, ?, ?, ?)";
  db.query(sql, [id, name, title, imagePath], (err) => {
    if (err) throw err;
    req.flash("success", "Task submitted successfully!");
    res.redirect("/complaint");
  });
};
