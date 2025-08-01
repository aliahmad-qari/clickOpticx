const db = require("../config/db");

exports.getPayments = (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }

  const sqlProfile = `
        SELECT p.*, u.username 
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
    `;

  db.query(sqlProfile, [userId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    console.log("Query Results:", results);

    res.render("Request/request", {
      message: null,
      payments: results || [],
    });
  });
};

exports.profile = (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }

  console.log("User ID from session:", userId);

  const sqlUser = "SELECT * FROM users WHERE id = ?";
  const sqlPayments = `
    SELECT p.id, p.user_id, u.username, p.transaction_id, p.amount, p.package_name, d.coin_balance, p.created_at, p.discount, p.custom_amount , p.remaining_amount
    FROM payments p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN daily_tasks d ON p.user_id = d.user_id
  `;
  const backgroundSql = "SELECT * FROM nav_table";

  const NotifactionSql = `
    SELECT COUNT(*) AS totalNotifactions 
    FROM notifications 
    WHERE is_read = 0 
      AND created_at >= NOW() - INTERVAL 2 DAY
  `;

  const passwordSql = `
    SELECT * FROM notifications 
    WHERE is_read = 0 
      AND created_at >= NOW() - INTERVAL 2 DAY 
    ORDER BY id DESC
  `;

  db.query(sqlUser, [userId], (err, userResults) => {
    if (err) {
      console.error("Database query error (User):", err);
      return res.status(500).send("Internal Server Error");
    }

    if (userResults.length === 0) {
      console.error("User not found.");
      return res.redirect("/");
    }

    const isAdmin = userResults[0].role === "admin";
    const isUser = userResults[0].role === "user";

    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error (Background):", err);
        return res.status(500).send("Internal Server Error");
      }

      db.query(sqlPayments, (err, paymentResults) => {
        if (err) {
          console.error("Database query error (Payments):", err);
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

            // 👇 Flash messages here
            const successMsg = req.flash("success");

            res.render("Request/request", {
              user: userResults[0],
              message: null,
              isAdmin,
              payments: paymentResults,
              bg_result,
              messages: {
                success: successMsg.length > 0 ? successMsg[0] : null,
              },
              totalNotifactions,
              password_datass,
              isUser,
            });
          });
        });
      });
    });
  });
};

exports.UpdateUser = (req, res) => {
  const { userId, package, invoice, expiry } = req.body;

  if (!userId || !package || !invoice || !expiry) {
    return res
      .status(400)
      .json({ message: "User ID, Package, Invoice, and Expiry are required." });
  }

  const updateQuery =
    "UPDATE users SET plan = ?, invoice = ?, expiry = ? WHERE id = ?";
  
  db.query(updateQuery, [package, invoice, expiry, userId], (err, result) => {
    if (err) {
      console.error("Database update error:", err);
      return res.status(500).json({ message: "Database update failed." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User updated successfully." });
  });
};

exports.DeleteUser = (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM payments WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "User deleted successfully!");
    res.redirect("/request");
  });
};

exports.sendRespit = (req, res) => {
  const { user_id, username, transaction_id, amount, package_name, coins, custom_amount,remaining_amount, Accepted } = req.body;



  const insertSql = `
    INSERT INTO respits (user_id, username, transaction_id, amount, package_name, coins, custom_amount,remaining_amount, Accepted)
    VALUES (?, ?, ?, ?, ?, ?, ?,?, ?)
  `;

  db.query(insertSql, [user_id, username, transaction_id, amount, package_name, coins, custom_amount,remaining_amount, Accepted ], (err, result) => {
    if (err) {
      console.error('Error inserting respit:', err);
      return res.status(500).send('Server error');
    }

    // Update daily_tasks after successful insertion
    const updateSql = `UPDATE daily_tasks SET coin_balance = 0 WHERE user_id = ?`;
    db.query(updateSql, [user_id], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Error updating coin_balance:', updateErr);
        return res.status(500).send('Server error');
      }

      res.redirect('/request');
    });
  });
};


