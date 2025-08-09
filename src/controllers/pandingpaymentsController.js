const db = require("../config/db");

exports.getPackagesByStatus = (req, res) => {
  const { status } = req.query;

  const sql = `
    SELECT 
      p.id,
      p.package_name,
      p.username,
      p.transaction_id,
      p.amount,
      p.created_at,
      p.expiry_date,
      p.package_status,
      p.invoice_status,
      u.Username,
      u.Email
    FROM payments p
    JOIN users u ON p.user_id = u.id
    WHERE p.package_status = ? OR p.invoice_status = ?
    ORDER BY p.created_at DESC
  `;

  db.query(sql, [status, status], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error filtering packages' });
    res.json(results);
  });
};


// 4. All Package Requests
exports.getAllPackageRequests = (req, res) => {
  const sql = `
    SELECT 
      pay.id,
      pay.package_name,
      u.Username,
      pay.home_collection,
      pay.collection_address,
      pay.contact_number,
      pay.preferred_time,
      pay.special_instructions,
      pay.transaction_id,
      pay.amount,
      pay.custom_amount,
      pay.created_at as request_date,
      CASE 
        WHEN pay.package_status = 'active' AND pay.invoice_status = 'Paid' THEN 'Paid'
        WHEN pay.package_status = 'active' AND pay.invoice_status = 'Unpaid' THEN 'Unpaid'
        WHEN pay.package_status IS NULL THEN 'Pending'
        ELSE pay.package_status
      END AS package_status
    FROM payments pay
    JOIN users u ON pay.user_id = u.id
    ORDER BY pay.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching package requests:', err);
      return res.status(500).json({ message: 'Error fetching package requests' });
    }
    
    // Debug: Log home collection requests
    const homeCollectionRequests = results.filter(req => req.home_collection === 'yes');
    console.log(`🏠 Found ${homeCollectionRequests.length} home collection requests out of ${results.length} total requests`);
    
    res.json(results);
  });
};


// 5. Pending Payments by User
exports.getPendingPaymentsByUser = (req, res) => {
  const sql = `
    SELECT 
      u.id AS user_id,
      u.Username,
      u.Email,
      u.Number as user_phone,
      SUM(p.amount) AS total_amount,
      SUM(p.custom_amount) AS total_custom_amount,
      COUNT(p.id) AS total_pending_payments,
      MAX(p.created_at) AS last_payment_date,
      GROUP_CONCAT(DISTINCT p.package_name) AS packages,
      GROUP_CONCAT(DISTINCT p.transaction_id) AS transaction_ids
    FROM users u
    JOIN payments p ON u.id = p.user_id
    WHERE p.invoice_status = 'Unpaid' OR p.package_status = 'pending'
    GROUP BY u.id, u.Username, u.Email, u.Number
    ORDER BY u.Username ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching grouped pending payments:", err);
      return res.status(500).json({ message: 'Error fetching grouped pending payments' });
    }

    res.json(results);
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
    WHERE p.home_collection = 'yes' OR p.special_instructions IS NOT NULL
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

exports.renderPendingPaymentsPage = (req, res) => {
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

            // ✅ Fixed grouped pending payments query using correct payment table columns
            const groupedPaymentsSql = `
              SELECT 
                u.id AS user_id,
                u.Username,
                u.Email,
                u.Number as user_phone,
                u.address as user_address,
                SUM(p.amount) AS total_amount,
                SUM(p.custom_amount) AS total_custom_amount,
                COUNT(p.id) AS total_pending_payments,
                MAX(p.created_at) AS last_payment_date,
                GROUP_CONCAT(DISTINCT p.package_name) AS packages
              FROM users u
              JOIN payments p ON u.id = p.user_id
              WHERE p.invoice_status = 'Unpaid' OR p.package_status = 'pending'
              GROUP BY u.id, u.Username, u.Email, u.Number, u.address
              ORDER BY u.Username ASC
            `;

            db.query(groupedPaymentsSql, (err, groupedPayments) => {
              if (err) return res.status(500).send("Grouped payments error");

              const isAdmin = results.length > 0 && results[0].role === "admin";
              const isUser = results.length > 0 && results[0].role === "user";
              const isteam = results.length > 0 && results[0].role === "Team";
              const totalNotifactions = NotifactionResult[0].totalNotifactions;
              const successMsg = req.flash("success");

              res.render("Billing-Payments/pandingpayments", {
                user: results,
                slider: sliderResults,
                bg_result,
                isAdmin,
                isUser,
                isteam,
                groupedPayments, // ✅ Now defined
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
  });
};


// 7. Unpaid vs Active Users
exports.getUnpaidVsActiveUsers = (req, res) => {
  const sql = `
    SELECT u.id, u.Username, u.Email, u.plan, 
      CASE 
        WHEN SUM(CASE WHEN p.invoice_status = 'Paid' THEN 1 ELSE 0 END) > 0 THEN 'Paid'
        WHEN SUM(CASE WHEN p.invoice_status = 'Unpaid' OR p.package_status = 'pending' THEN 1 ELSE 0 END) > 0 THEN 'Unpaid'
        ELSE 'No Payment'
      END AS payment_status,
      COUNT(p.id) as total_payments,
      SUM(p.amount) as total_amount
    FROM users u
    LEFT JOIN payments p ON u.id = p.user_id
    GROUP BY u.id, u.Username, u.Email, u.plan
    ORDER BY u.Username ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Query error', err });
    res.json(results);
  });
};

// 8. Get All Payments with Search
exports.getPayments = (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT p.*, u.Username, u.Number as user_phone, u.address as user_address
    FROM payments p
    JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    if (!isNaN(search)) {
      query += ' AND p.user_id = ?';
      params.push(search);
    } else {
      query += `
        AND (
          u.Username LIKE ? OR
          DATE(p.created_at) = ? OR
          DATE(p.expiry_date) = ?
        )
      `;
      params.push(`%${search}%`, search, search);
    }
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error retrieving payments' });
    res.json(results);
  });
};

// 1. Get All Paid Users
exports.getPaidUsers = (req, res) => {
  const sql = `
    SELECT DISTINCT u.id, u.Username, u.Email, u.plan,
           COUNT(p.id) as total_payments,
           SUM(p.amount) as total_amount,
           MAX(p.created_at) as last_payment_date,
           GROUP_CONCAT(DISTINCT p.package_name) as packages
    FROM users u
    JOIN payments p ON u.id = p.user_id
    WHERE p.invoice_status = 'Paid' AND p.package_status = 'active'
    GROUP BY u.id, u.Username, u.Email, u.plan
    ORDER BY u.Username ASC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching paid users:", err);
      return res.status(500).json({ message: 'Error fetching paid users' });
    }
    res.json(results);
  });
};

// 9. Delete Payment
exports.deletePayment = (req, res) => {
  const paymentId = req.params.id;
  const sql = 'DELETE FROM payments WHERE id = ?';
  db.query(sql, [paymentId], (err) => {
    if (err) return res.status(500).send('Error deleting payment');
    res.redirect('/paymentshistory');
  });
};
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

               const paymentsSql = "SELECT * FROM payments WHERE status = 'pending'";

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

                  res.render("Billing-Payments/pandingpayments", {
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

// Render function for paid-users page
exports.renderPaidUsersPage = (req, res) => {
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


            res.render("Billing-Payments/paid-users", {
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

// Render function for packages-by-status page
exports.renderPackagesByStatusPage = (req, res) => {
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

            res.render("Billing-Payments/packages-by-status", {
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

// Render function for all-package-requests page
exports.renderAllPackageRequestsPage = (req, res) => {
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

// Render function for manual-package-requests page
exports.renderManualPackageRequestsPage = (req, res) => {
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

            res.render("Billing-Payments/manual-package-requests", {
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

// Render function for unpaid-vs-active-users page
exports.renderUnpaidVsActiveUsersPage = (req, res) => {
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

 