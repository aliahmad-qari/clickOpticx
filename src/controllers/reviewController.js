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
  const sqlFeedback = "SELECT * FROM feedback";

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

        db.query(sqlFeedback, (err, feedbackResults) => {
          if (err) {
            console.error("Database error while fetching feedback:", err);
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
                console.error("Database query error (Notifications):", err);
                return res.status(500).send("Internal Server Error");
              }

              const successMsg = req.flash("success");

              res.render("ReviewAdmin/review", {
                user: userResults[0],
                message: null,
                isAdmin,
                payments: paymentResults,
                bg_result,
                feedback: feedbackResults,
                totalNotifactions,
                password_datass,
                isUser,
                messages: {
                  success: successMsg.length > 0 ? successMsg[0] : null,
                },
              });
            });
          });
        });
      });
    });
  });
};

exports.review = (req, res) => {
  const feedbackId = req.params.id;
  const deleteQuery = "DELETE FROM feedback WHERE id = ?";
  db.query(deleteQuery, [feedbackId], (err, result) => {
    if (err) {
      console.error("Error deleting feedback:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "Feedback deleted successfully!");
    res.redirect("/review");
  });
};
