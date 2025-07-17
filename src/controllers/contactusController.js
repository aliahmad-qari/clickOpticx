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

    // ssssssssss
    const backgroundSql = "SELECT * FROM data_entries";
    db.query(backgroundSql, (err, password_data) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      const NotifactionSql =
        "SELECT COUNT(*) AS totalNotifactions FROM notifications";
      db.query(NotifactionSql, (err, NotifactionResult) => {
        if (err) {
          console.error("Error fetching total complaints:", err);
          return res.status(500).send("Database error");
        }
        const totalNotifactions = NotifactionResult[0].totalNotifactions;
        // ssssssss

        const backgroundSql = "SELECT * FROM nav_table";
        db.query(backgroundSql, (err, bg_result) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Internal Server Error");
          }
          //

          // Format the created_at date
          userResults[0].created_at = moment(userResults[0].created_at).format(
            "YYYY-MM-DD"
          );

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

                  const sqlPayments =
                    "SELECT * FROM payments WHERE user_id = ?";

                  db.query(sqlPayments, [userId], (err, paymentResults) => {
                    if (err) {
                      console.error(
                        "Database error while fetching payments:",
                        err
                      );
                      return res.status(500).send("Database error");
                    }

                    // Format payment dates
                    paymentResults.forEach((payment) => {
                      payment.created_at = moment(payment.created_at).format(
                        "YYYY-MM-DD"
                      );
                    });
                    // 👇 Flash messages here
                    const successMsg = req.flash("success");

                    res.render("contactus/contactUs", {
                      user: userResults[0],
                      message: null,
                      isAdmin,
                      payments: paymentResults,
                      bg_result,
                      password_data,
                      messages: {
                        success: successMsg.length > 0 ? successMsg[0] : null,
                      },
                      totalNotifactions,
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
  });
};

exports.feedback = (req, res) => {
  const { rating, feedback_text, first_name, last_name, email } = req.body;
  const sql = `INSERT INTO feedback (rating, feedback_text, first_name, last_name, email)
               VALUES (?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [rating, feedback_text, first_name, last_name, email],
    (err, result) => {
      if (err) {
        console.error("Error inserting feedback:", err);
        return res.status(500).send("Database error");
      }
      req.flash("success", "Thank you for your Feedback!");
      res.redirect("/contactus");
    }
  );
};

exports.AllComplaint = (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect("/");
  }

  // Fetch user profile data and complaints in one go
  const sqlProfile = "SELECT user_img  FROM users WHERE id = ?";
  const sqlComplaints =
    "SELECT username, number , Plane, Complaint, Address, status FROM usercomplaint WHERE user_id = ?";

  db.query(sqlProfile, [userId], (err, userResults) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (userResults.length === 0) {
      return res.status(404).send("User not found");
    }

    db.query(sqlComplaints, [userId], (err, complaintResults) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, bg_result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }
        //

        const isAdmin =
          userResults.length > 0 ? userResults[0].role === "admin" : false;

        res.render("contactus/contactUs", {
          users: complaintResults,
          user: userResults[0],
          message: null,
          bg_result,
          isAdmin,
        });
      });
    });
  });
};

// Inserting a new complaint
exports.UserComplaint = (req, res) => {
  const { username, number, Plane, Complaint, Address } = req.body;
  const userId = req.session.userId;
  const message = "Complaint:";

  if (!userId) {
    return res.status(400).send("User not logged in");
  }

  const checkUserQuery = "SELECT id FROM users WHERE id = ?";
  db.query(checkUserQuery, [userId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (results.length === 0) {
      return res.status(400).send("Invalid user ID. User does not exist.");
    }

    const insertComplaintQuery =
      "INSERT INTO usercomplaint (username, number, Plane, Complaint, Address, user_id) VALUES (?, ?, ?, ?, ?, ?)";

    db.query(
      insertComplaintQuery,
      [username, number, Plane, Complaint, Address, userId],
      (err, result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }
        // 2. Insert message into notifications table
        const sqlNotif = `
            INSERT INTO notifications (username,Complaint,message)
            VALUES (?,?,?)
        `;

        db.query(
          sqlNotif,
          [username, Complaint, message],
          (err, notifResult) => {
            if (err) {
              console.error("❌ SQL Error (notifications):", err);
              req.flash("error", "Error saving to notifications table.");
              return res.redirect("/changepassword");
            }

            req.flash("success", "your complaint has been submitted");
            res.redirect("/contactUs");
          }
        );
      }
    );
  });
};
