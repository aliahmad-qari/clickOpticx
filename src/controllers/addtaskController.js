const db = require("../config/db");
const moment = require("moment");

exports.profile = (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }

  const sqlProfile = "SELECT * FROM users WHERE id = ?";
  const backgroundSql = "SELECT * FROM nav_table";
  const sqlPayments = "SELECT * FROM payments WHERE user_id = ?";
  const taskQuery = "SELECT * FROM tasks ORDER BY created_at DESC";

  // ✅ Unread notifications count (last 2 days)
  const NotifactionSql = `
    SELECT COUNT(*) AS totalNotifactions 
    FROM notifications 
    WHERE is_read = 0 
      AND created_at >= NOW() - INTERVAL 2 DAY
  `;

  // ✅ Detailed unread notifications
  const passwordSql = `
    SELECT * FROM notifications 
    WHERE is_read = 0 
      AND created_at >= NOW() - INTERVAL 2 DAY 
    ORDER BY id DESC
  `;

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

    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      db.query(sqlPayments, [userId], (err, paymentResults) => {
        if (err) {
          console.error("Database error while fetching payments:", err);
          return res.status(500).send("Database error");
        }

        paymentResults.forEach((payment) => {
          payment.created_at = moment(payment.created_at).format("YYYY-MM-DD");
        });

        db.query(taskQuery, (err, taskResults) => {
          if (err) {
            console.error("Error fetching tasks:", err);
            return res.status(500).send("Database error");
          }

          db.query(NotifactionSql, (err, NotifactionResult) => {
            if (err) {
              console.error("Error fetching total notifications:", err);
              return res.status(500).send("Database error");
            }

            const totalNotifactions = NotifactionResult[0].totalNotifactions;

            db.query(passwordSql, (err, password_datass) => {
              if (err) {
                console.error("Error fetching notification details:", err);
                return res.status(500).send("Database error");
              }

              const successMsg = req.flash("success");

              // ✅ Final render
              res.render("Addtasks/addtask", {
                user: userResults[0],
                message: null,
                isAdmin,
                payments: paymentResults,
                bg_result,
                messages: {
                  success: successMsg.length > 0 ? successMsg[0] : null,
                },
                tasks: taskResults,
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
};
exports.task = (req, res) => {
  const { title, paragraph, link } = req.body;
  const image = req.file.path;

  const sql =
    "INSERT INTO tasks (title, paragraph, image, link) VALUES (?, ?, ?, ?)";
  db.query(sql, [title, paragraph, image, link], (err, result) => {
    if (err) throw err;
    req.flash("success", "Task added successfully!");
    res.redirect("/addtask");
  });
};

exports.getTasks = (req, res) => {
  const query = "SELECT * FROM tasks ORDER BY created_at DESC";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching tasks:", err);
      return res.status(500).send("Database error");
    }

    res.render("tasks", { tasks: results });
  });
};

exports.deleteTask = (req, res) => {
  const taskId = req.params.id;

  const deleteQuery = "DELETE FROM tasks WHERE id = ?";
  db.query(deleteQuery, [taskId], (err, result) => {
    if (err) {
      console.error("Error deleting task:", err);
      return res.status(500).send("Server error");
    }
    req.flash("success", "Task deleted successfully!");
    res.redirect("/addtask");
  });
};
