const db = require("../config/db");
exports.getPaidUsers = (req, res) => {
  const sql = `
    SELECT DISTINCT u.id, u.Username, u.Email, u.plan,
           COUNT(p.id) as total_payments,
           SUM(p.amount) as total_amount,
           MAX(p.created_at) as last_payment_date
    FROM users u
    JOIN payments p ON u.id = p.user_id
    WHERE p.invoice_status = 'Paid' AND p.package_status = 'active'
    GROUP BY u.id, u.Username, u.Email, u.plan
    ORDER BY u.Username ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching paid users' });
    res.json(results);
  });
};

exports.getPackagesByStatus = (req, res) => {
  const { status } = req.query;

  const sql = `
    SELECT p.id, p.package_name, u.Username, p.status
    FROM packages p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = ?
  `;

  db.query(sql, [status], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error filtering packages' });
    res.json(results);
  });
};

exports.getAllPackageRequests = (req, res) => {
  const sql = `
    SELECT p.id, p.package_name, p.package_status, p.invoice_status, p.status, p.amount, p.custom_amount,
           p.home_collection, p.collection_address, p.contact_number, p.preferred_time, p.special_instructions,
           p.transaction_id, p.created_at, p.user_id,
           u.Username, u.Number as user_phone, u.address as user_address
    FROM payments p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching package requests:', err);
      return res.status(500).json({ message: 'Error fetching package requests' });
    }
    console.log('Package requests fetched:', results.length, 'records');
    res.json(results);
  });
};

exports.getPendingPaymentsByUser = (req, res) => {
  const userId = req.session.userId;

  const sqlProfile = `
    SELECT Username, Email, plan, invoice, user_img, role 
    FROM users WHERE id = ?`;

  const sql = `
    SELECT 
      u.id AS user_id,
      u.Username,
      u.Email,
      p.id AS payment_id,
      p.package_name,
      p.username,
      p.amount,
      p.custom_amount,
      p.discount,
      p.remaining_amount,
      p.transaction_id,
      p.created_at,
      p.expiry_date,
      p.package_status,
      p.invoice_status,
      p.home_collection,
      p.collection_address,
      p.contact_number,
      p.preferred_time,
      p.special_instructions
    FROM users u
    JOIN payments p ON u.id = p.user_id
    WHERE p.invoice_status = 'Unpaid' OR p.package_status = 'pending'
    ORDER BY u.Username ASC, p.created_at DESC
  `;

  db.query(sqlProfile, [userId], (err, userResults) => {
    if (err) return res.status(500).send("Profile error");

    db.query(sql, (err, payments) => {
      if (err) {
        console.error("Error fetching detailed pending payments:", err);
        return res.status(500).json({ message: 'Error fetching pending payments' });
      }

      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, bg_result) => {
        if (err) return res.status(500).send("Background error");

        const passwordSql = `
          SELECT * FROM notifications 
          WHERE is_read = 0 
          AND created_at >= NOW() - INTERVAL 2 DAY 
          ORDER BY id DESC`;

        db.query(passwordSql, (err, password_data) => {
          if (err) return res.status(500).send("Notifications error");

          const NotifactionSql = `
            SELECT COUNT(*) AS totalNotifactions 
            FROM notifications 
            WHERE is_read = 0 
            AND created_at >= NOW() - INTERVAL 2 DAY`;

          db.query(NotifactionSql, (err, NotifactionResult) => {
            if (err) return res.status(500).send("Notif count error");

            const user = userResults[0] || {};
            const isAdmin = user.role === "admin";
            const isUser = user.role === "user";
            const isteam = user.role === "Team";
            const totalNotifactions = NotifactionResult[0].totalNotifactions;

            res.render("Billing-Payments/pending-by-user", {
              user: userResults,
              payments,
              bg_result,
              isAdmin,
              isUser,
              isteam,
              totalNotifactions,
              password_data,
              message: null,
              messages: {
                success: req.flash("success")[0] || null,
              },
            });
          });
        });
      });
    });
  });
};
exports.renderPaymentHistoryPage = (req, res) => {
  const userId = req.session.userId;

  const sqlProfile = `
    SELECT Username, Email, plan, invoice, user_img, role 
    FROM users WHERE id = ?`;
  const sqlPayments = "SELECT * FROM payments";
  const backgroundSql = "SELECT * FROM nav_table";
  const notifCountSql = `
    SELECT COUNT(*) AS totalNotifactions 
    FROM notifications 
    WHERE is_read = 0 
    AND created_at >= NOW() - INTERVAL 2 DAY`;
  const notifDetailsSql = `
    SELECT * FROM notifications 
    WHERE is_read = 0 
    AND created_at >= NOW() - INTERVAL 2 DAY 
    ORDER BY id DESC`;

  db.query(sqlProfile, [userId], (err, userResults) => {
    if (err) return res.status(500).send("Profile error");

    db.query(sqlPayments, (err, payments) => {
      if (err) return res.status(500).send("Payments error");

      db.query(backgroundSql, (err, bg_result) => {
        if (err) return res.status(500).send("Background error");

        db.query(notifCountSql, (err, notifCountResult) => {
          if (err) return res.status(500).send("Notification count error");

          db.query(notifDetailsSql, (err, password_data) => {
            if (err) return res.status(500).send("Notification list error");

            const user = userResults[0] || {};
            const isAdmin = user.role === "admin";
            const isUser = user.role === "user";
            const isteam = user.role === "Team";
            const totalNotifactions = notifCountResult[0].totalNotifactions;

            res.render("Billing-Payments/paymentshistory", {
              user: userResults,
              payments,
              bg_result,
              totalNotifactions,
              password_data,
              isAdmin,
              isUser,
              isteam,
              message: null,
              messages: {
                success: req.flash("success")[0] || null,
              },
            });
          });
        });
      });
    });
  });
};



exports.getManualPackageRequests = (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.package_name,
      p.username,
      p.transaction_id,
      p.amount,
      p.created_at,
      p.expiry_date,
      p.custom_amount,
      p.discount,
      p.remaining_amount,
      p.package_status,
      p.invoice_status,
      p.home_collection,
      p.collection_address,
      p.contact_number,
      p.preferred_time,
      p.special_instructions,
      u.Username as user_name,
      u.Email as user_email
    FROM payments p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.home_collection = 1 OR p.special_instructions IS NOT NULL
    ORDER BY p.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error retrieving manual requests:', err);
      return res.status(500).json({ message: 'Error retrieving manual requests' });
    }
    res.json(results);
  });
};

exports.getUnpaidVsActiveUsers = (req, res) => {
  const sql = `
    SELECT u.id, u.Username, u.Email, u.plan, 
      CASE 
        WHEN p.status = 'paid' THEN 'Paid'
        WHEN p.status = 'active' THEN 'Active'
        ELSE 'Unpaid'
      END AS payment_status
    FROM users u
    LEFT JOIN payments p ON u.id = p.user_id
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Query error', err });
    res.json(results);
  });
};

// Select image

exports.Slider_imgs = (req, res) => {
  const userId = req.session.userId;

  const sqlProfile = `
      SELECT Username, Email, plan ,  invoice, user_img , role 
      FROM users WHERE id = ?`;

  const sqlSlider = "SELECT * FROM slider";

  db.query(sqlProfile, [userId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    db.query(sqlSlider, (err, sliderResults) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      const sub = "SELECT * FROM fibre_form_submissions";
      db.query(sub, (err, submissions) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }

        const wirelessSub = "SELECT * FROM wireless_forms";
        db.query(wirelessSub, (err, wirelessForms) => {
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

            const passwordSql = `
              SELECT * FROM notifications 
              WHERE is_read = 0 
              AND created_at >= NOW() - INTERVAL 2 DAY 
              ORDER BY id DESC
            `;
            db.query(passwordSql, (err, password_data) => {
              if (err) {
                console.error("Error fetching notification details:", err);
                return res.status(500).send("Server Error");
              }

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

                const paymentsSql = "SELECT * FROM payments";
                db.query(paymentsSql, (err, payments) => {
                  if (err) {
                    console.error("Error fetching payments:", err);
                    return res.status(500).send("Server Error");
                  }

                  const totalNotifactions = NotifactionResult[0].totalNotifactions;
                  const successMsg = req.flash("success");

                  const isAdmin = results.length > 0 && results[0].role === "admin";
                  const isUser = results.length > 0 && results[0].role === "user";
                  const isteam = results.length > 0 && results[0].role === "Team";

                  res.render("Billing-Payments/paymentshistory", {
                    user: results,
                    slider: sliderResults,
                    message: null,
                    isAdmin,
                    isUser,
                    bg_result,
                    isteam,
                    submissions,
                    wirelessForms,
                    totalNotifactions,
                    password_data,
                    payments, // ✅ now defined
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
    });
  });
};

// Render function for unpaid-vs-active-users page (from payment analysis route)
exports.renderPaymentAnalysisPage = (req, res) => {
  const userId = req.session.userId;

  const sqlProfile = `
    SELECT Username, Email, plan, invoice, user_img, role 
    FROM users WHERE id = ?`;

  const sqlSlider = "SELECT * FROM slider";

  db.query(sqlProfile, [userId], (err, results) => {
    if (err) return res.status(500).send("Profile error");

    db.query(sqlSlider, (err, sliderResults) => {
      if (err) return res.status(500).send("Slider error");

      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, bg_result) => {
        if (err) return res.status(500).send("Background error");

        const passwordSql = `
          SELECT * FROM notifications 
          WHERE is_read = 0 
          AND created_at >= NOW() - INTERVAL 2 DAY 
          ORDER BY id DESC`;

        db.query(passwordSql, (err, password_data) => {
          if (err) return res.status(500).send("Notifications error");

          const NotifactionSql = `
            SELECT COUNT(*) AS totalNotifactions 
            FROM notifications 
            WHERE is_read = 0 
            AND created_at >= NOW() - INTERVAL 2 DAY`;

          db.query(NotifactionSql, (err, NotifactionResult) => {
            if (err) return res.status(500).send("Notif count error");

            const isAdmin = results.length > 0 && results[0].role === "admin";
            const isUser = results.length > 0 && results[0].role === "user";
            const isteam = results.length > 0 && results[0].role === "Team";
            const totalNotifactions = NotifactionResult[0].totalNotifactions;
            const successMsg = req.flash("success");

            res.render("Billing-Payments/unpaid-vs-active-users", {
              user: results,
              slider: sliderResults,
              bg_result,
              isAdmin,
              isUser,
              isteam,
              totalNotifactions,
              password_data,
              message: null,
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

// Render function for all-package-requests page (from payment reports route)
exports.renderPaymentReportsPage = (req, res) => {
  const userId = req.session.userId;

  const sqlProfile = `
    SELECT Username, Email, plan, invoice, user_img, role 
    FROM users WHERE id = ?`;

  const sqlSlider = "SELECT * FROM slider";

  db.query(sqlProfile, [userId], (err, results) => {
    if (err) return res.status(500).send("Profile error");

    db.query(sqlSlider, (err, sliderResults) => {
      if (err) return res.status(500).send("Slider error");

      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, bg_result) => {
        if (err) return res.status(500).send("Background error");

        const passwordSql = `
          SELECT * FROM notifications 
          WHERE is_read = 0 
          AND created_at >= NOW() - INTERVAL 2 DAY 
          ORDER BY id DESC`;

        db.query(passwordSql, (err, password_data) => {
          if (err) return res.status(500).send("Notifications error");

          const NotifactionSql = `
            SELECT COUNT(*) AS totalNotifactions 
            FROM notifications 
            WHERE is_read = 0 
            AND created_at >= NOW() - INTERVAL 2 DAY`;

          db.query(NotifactionSql, (err, NotifactionResult) => {
            if (err) return res.status(500).send("Notif count error");

            const isAdmin = results.length > 0 && results[0].role === "admin";
            const isUser = results.length > 0 && results[0].role === "user";
            const isteam = results.length > 0 && results[0].role === "Team";
            const totalNotifactions = NotifactionResult[0].totalNotifactions;
            const successMsg = req.flash("success");

            res.render("Billing-Payments/all-package-requests", {
              user: results,
              slider: sliderResults,
              bg_result,
              isAdmin,
              isUser,
              isteam,
              totalNotifactions,
              password_data,
              message: null,
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

 

exports.getPayments = async (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM payments WHERE 1=1';
  const params = [];

if (search) {
  if (!isNaN(search)) {
    query += ' AND user_id = ?';
    params.push(search);
  } else {
    query += `
      AND (
        username LIKE ? OR
        DATE(created_at) = ? OR
        DATE(expiry_date) = ?
      )
    `;
    params.push(`%${search}%`, search, search); // 👈 this should be inside else
  }
}

  try {
    const [payments] = await db.execute(query, params);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving payments', error });
  }
};

// delete payment controller
exports.deletePayment = (req, res) => {
  const paymentId = req.params.id;

  const sql = 'DELETE FROM payments WHERE id = ?';
  db.query(sql, [paymentId], (err, result) => {
    if (err) {
      console.error('Error deleting payment:', err);
      return res.status(500).send('Error deleting payment');
    }
    res.redirect('/paymentshistory'); 
  });
};