const db = require("../config/db");

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
            db.query(passwordSql, (err, password_datass) => {
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
                    password_datass,
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

 

exports.getPayments = async (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM payments WHERE 1=1';
  const params = [];

  if (search) {
    query += `
      AND (
        user_id = ? OR
        username LIKE ? OR
        DATE(created_at) = ? OR
        DATE(expiry_date) = ?
      )
    `;
    params.push(search, `%${search}%`, search, search);
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