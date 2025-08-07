const db = require("../config/db");

exports.getPayments = (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }

  // First, get the user data and role
  const sqlUser = "SELECT * FROM users WHERE id = ?";
  db.query(sqlUser, [userId], (err, userResults) => {
    if (err) {
      console.error("Database query error (User):", err);
      return res.status(500).send("Internal Server Error");
    }

    if (userResults.length === 0) {
      console.error("User not found.");
      return res.redirect("/");
    }

    const user = userResults[0];
    const isAdmin = user.role === "admin";
    const isUser = user.role === "user";

    // Get payments with proper filtering
    const sql = `
      SELECT p.*, u.username, u.Number as user_phone, u.address as user_address,
             p.home_collection, p.collection_address, p.contact_number, 
             p.preferred_time, p.special_instructions
      FROM payments p
      JOIN users u ON p.user_id = u.id
      ${isAdmin ? "" : "WHERE p.user_id = ?"}
      ORDER BY p.id DESC
    `;

    const queryParams = isAdmin ? [] : [userId];

    db.query(sql, queryParams, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      console.log("🔍 Query Results Count:", results.length);
      console.log("🔍 Sample payment data:");
      results.forEach((payment, index) => {
        if (index < 3) { // Show first 3 records
          console.log(`🔍 Payment ${index + 1}:`, {
            id: payment.id,
            username: payment.username,
            home_collection: payment.home_collection,
            collection_address: payment.collection_address,
            contact_number: payment.contact_number,
            package_name: payment.package_name,
            created_at: payment.created_at
          });
        }
      });

      // Get additional required data
      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, bg_result) => {
        if (err) {
          console.error("Database query error (Background):", err);
          return res.status(500).send("Internal Server Error");
        }

        const NotifactionSql = `
          SELECT COUNT(*) AS totalNotifactions 
          FROM notifications 
          WHERE is_read = 0 
            AND created_at >= NOW() - INTERVAL 2 DAY
        `;
        db.query(NotifactionSql, (err, NotifactionResult) => {
          if (err) {
            console.error("Error fetching total notifications:", err);
            return res.status(500).send("Database error");
          }

          const totalNotifactions = NotifactionResult[0].totalNotifactions;

          const passwordSql = `
            SELECT * FROM notifications 
            WHERE is_read = 0 
              AND created_at >= NOW() - INTERVAL 2 DAY 
            ORDER BY id DESC
          `;
          db.query(passwordSql, (err, password_data) => {
            if (err) {
              console.error("Database query error (Notifications):", err);
              return res.status(500).send("Internal Server Error");
            }

            // Flash messages
            const successMsg = req.flash("success");

            res.render("Request/request", {
              user,
              message: null,
              isAdmin,
              payments: results || [],
              bg_result,
              messages: {
                success: successMsg.length > 0 ? successMsg[0] : null,
              },
              totalNotifactions,
              password_data: password_data,
              isUser,
            });
          });
        });
      });
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
    SELECT p.id, p.user_id, u.username, u.Number as user_phone, u.address as user_address, p.transaction_id, p.amount, p.package_name, d.coin_balance, p.created_at, p.discount, p.custom_amount, p.remaining_amount,
           p.home_collection, p.collection_address, p.contact_number, p.preferred_time, p.special_instructions
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

          db.query(passwordSql, (err, password_data) => {
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
              password_data: password_data, 
              isUser,
            });
          });
        });
      });
    });
  });
};

exports.UpdateUser = (req, res) => {
  const { userId, invoice_status, package_status, expiry } = req.body;

  if (!userId || !invoice_status || !package_status || !expiry) {
    return res.status(400).json({
      message: "User ID, Package, Invoice, and Expiry are required.",
    });
  }

  const updateQuery = `
    UPDATE payments 
    SET invoice_status = ?, package_status = ?, expiry_date = ?
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(updateQuery, [invoice_status, package_status, expiry, userId], (err, result) => {
    if (err) {
      console.error("❌ Database update error:", err);
      return res.status(500).json({ message: "Database update failed." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payment record not found." });
    }

    req.flash("success", "Payment record updated successfully!");
    res.redirect("/request");
  });
};


const moment = require("moment");

exports.updatePlan = (req, res) => {
  const user_id = req.body.user_id;
  const invoice_status = req.body.invoice_status?.toLowerCase();
  const package_status = req.body.package_status?.toLowerCase();
  const expiry = req.body.expiry;

  // ✅ Only lowercase values are allowed
  const validInvoiceStatuses = ["paid", "unpaid"];
  const validPackageStatuses = ["active", "pending", "expired"];

  if (!user_id || !invoice_status || !package_status || !expiry) {
    return res.status(400).json({
      message: "User ID, Invoice Status, Package Status, and Expiry are required.",
    });
  }

  if (!validInvoiceStatuses.includes(invoice_status) || !validPackageStatuses.includes(package_status)) {
    return res.status(400).json({
      message: "Invalid invoice or package status.",
    });
  }

  console.log("🟡 Admin UpdatePlan Request:", {
    user_id,
    invoice_status,
    package_status,
    expiry,
  });

  const updateQuery = `
    UPDATE payments 
    SET invoice_status = ?, package_status = ?, expiry_date = ?
    WHERE id = (
      SELECT id FROM (
        SELECT id FROM payments WHERE user_id = ? ORDER BY id DESC LIMIT 1
      ) AS latest
    )
  `;

  db.query(updateQuery, [invoice_status, package_status, expiry, user_id], (err, result) => {
    if (err) {
      console.error("❌ Database error in updatePlan:", err);
      return res.status(500).json({ message: "Failed to update plan." });
    }

    if (result.affectedRows === 0) {
      console.warn("⚠️ No matching record found for user_id:", user_id);
      return res.status(404).json({ message: "No matching payment record found." });
    }

    req.flash("success", "Plan updated successfully.");
    return res.redirect("/index");
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


