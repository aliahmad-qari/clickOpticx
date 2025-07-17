const db = require("../config/db");
const moment = require("moment");

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

    userResults[0].created_at = moment(userResults[0].created_at).format(
      "YYYY-MM-DD"
    );
    const isAdmin = userResults[0].role === "admin";
    const isUser = userResults[0].role === "user";

    const backgroundSql = "SELECT * FROM nav_table";
    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      const sqlPayments = "SELECT * FROM payments WHERE user_id = ?";
      db.query(sqlPayments, [userId], (err, paymentResults) => {
        if (err) {
          console.error("Database error while fetching payments:", err);
          return res.status(500).send("Database error");
        }

        paymentResults.forEach((payment) => {
          payment.created_at = moment(payment.created_at).format("YYYY-MM-DD");
        });

        const taskQuery = `
          SELECT id, title, image, created_at, user_id, user_name 
          FROM daily_tasks 
          ORDER BY created_at DESC
        `;

        db.query(taskQuery, (err, taskResults) => {
          if (err) {
            console.error("Error fetching tasks:", err);
            return res.status(500).send("Database error");
          }

          const taskCountQuery = `
            SELECT user_name, COUNT(*) AS task_count
            FROM daily_tasks
            GROUP BY user_name
          `;

          db.query(taskCountQuery, (err, countResults) => {
            if (err) {
              console.error("Error fetching task counts:", err);
              return res.status(500).send("Database error");
            }

            const userTaskCounts = {};
            countResults.forEach((row) => {
              userTaskCounts[row.user_name] = row.task_count;
            });

            const uniqueUsers = {};
            const filteredTasks = taskResults.filter((task) => {
              if (!uniqueUsers[task.user_name]) {
                uniqueUsers[task.user_name] = true;
                return true;
              }
              return false;
            });

            const query =
              "SELECT * FROM daily_tasks ORDER BY user_name, created_at DESC";
            db.query(query, (err, userTasks) => {
              if (err) {
                console.error(err);
                return res.status(500).send("Server Error");
              }

              // ✅ New: Get total unread notifications
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

                const totalNotifactions =
                  NotifactionResult[0].totalNotifactions;

                // ✅ New: Get unread notification details
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

                  const successMsg = req.flash("success");

                  res.render("Completedtask/CompletedTask", {
                    user: userResults[0],
                    message: null,
                    isAdmin,
                    payments: paymentResults,
                    bg_result,
                    tasks: filteredTasks,
                    allTasks: taskResults,
                    userTaskCounts,
                    messages: {
                      success: successMsg.length > 0 ? successMsg[0] : null,
                    },
                    userDetails: userTasks[0],
                    totalNotifactions,
                    password_datass,
                    isUser,
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

exports.sendCoin = (req, res) => {
  const { user_id, coin_amount } = req.body;

  if (!user_id || !coin_amount) {
    return res.status(400).send("Missing fields");
  }

  const checkUserQuery = `SELECT * FROM daily_tasks WHERE user_id = ?`;
  db.query(checkUserQuery, [user_id], (err, result) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).send("Server error");
    }

    if (result.length === 0) {
      return res.status(404).send("User not found");
    }

    const updateCoinQuery = `UPDATE daily_tasks SET coin_balance = coin_balance + ? WHERE user_id = ?`;
    db.query(updateCoinQuery, [coin_amount, user_id], (err, result) => {
      if (err) {
        console.error("Error updating coin balance:", err);
        return res.status(500).send("Server error");
      }

      const message = `You have received ${coin_amount} coins.`;
      const is_read = 0;

      const notifSql = `
        INSERT INTO notifications_user (user_id, message, is_read)
        VALUES (?, ?, ?)
      `;

      db.query(notifSql, [user_id, message, is_read], (err, notifResult) => {
        if (err) {
          console.error("❌ SQL Error (notifications):", err);
          req.flash("error", "Error saving to notifications table.");
          return res.redirect("/UserComplaint");
        }

        req.flash("success", "Coin sent successfully!");
        res.redirect("/CompletedTask");
      });
    });
  });
};

exports.deleteTask = (req, res) => {
  const taskId = req.params.id;

  const sql = "DELETE FROM daily_tasks WHERE id = ?";
  db.query(sql, [taskId], (err, result) => {
    if (err) {
      console.error("Error deleting task:", err);
      return res.status(500).send("Internal Server Error");
    }

    res.redirect("/CompletedTask");
  });
};
