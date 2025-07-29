const db = require("../config/db");
const sql = require("../models/Cards");
const sql2 = require("../models/Slider");

// Get Profile Controller
exports.profile = (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }

  const sqlProfile = `
    SELECT username, Email, plan, invoice, transaction_id, expiry, user_img, amount, role 
    FROM users WHERE role='user'
  `;

  db.query(sqlProfile, [userId], (err, results) => {
    if (err) return res.status(500).send("Internal Server Error");

    const Cards = "SELECT * FROM cards";
    db.query(Cards, (err, cardResults) => {
      if (err) return res.status(500).send("Internal Server Error");

      const passwordSql = `
        SELECT * FROM notifications 
        WHERE is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY 
        ORDER BY id DESC
      `;
      db.query(passwordSql, (err, password_datass) => {
        if (err) return res.status(500).send("Internal Server Error");

        const sqlIcon = "SELECT * FROM icon_slider";
        db.query(sqlIcon, (err, Iconresult) => {
          if (err) return res.status(500).send("Internal Server Error");

          db.query("SELECT COUNT(*) AS count FROM payments", (err, paymentResult) => {
            if (err) return res.status(500).send("Database error");

            db.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'", (err, userResult) => {
              if (err) return res.status(500).send("Database error");

              db.query("SELECT COUNT(*) AS totalTeam FROM users WHERE role = 'team'", (err, teamResult) => {
                if (err) return res.status(500).send("Database error");

                db.query("SELECT COUNT(*) AS totalRequests FROM payments", (err, requestResult) => {
                  if (err) return res.status(500).send("Database error");

                  db.query("SELECT COUNT(*) AS totalComplaints FROM usercomplaint", (err, complaintResult) => {
                    if (err) return res.status(500).send("Database error");

                    db.query(`
                      SELECT COUNT(*) AS totalNotifactions 
                      FROM notifications 
                      WHERE is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY
                    `, (err, NotifactionResult) => {
                      if (err) return res.status(500).send("Database error");

                      db.query("SELECT COUNT(*) AS pendingCount FROM usercomplaint WHERE status = 'Pending'", (err, pendingResult) => {
                        if (err) return res.status(500).send("Database error");

                        db.query("SELECT COUNT(*) AS CompletedCount FROM usercomplaint WHERE status = 'Complete'", (err, CompletedResult) => {
                          if (err) return res.status(500).send("Database error");

                          db.query("SELECT COUNT(*) AS totalPackages FROM packages", (err, packageResult) => {
                            if (err) return res.status(500).send("Database error");

                            db.query("SELECT * FROM slider", (err, sliderResults) => {
                              if (err) return res.status(500).send("Internal Server Error");

                              db.query(`
                                SELECT COUNT(*) AS expiringSoon 
                                FROM payments 
                                WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                              `, (err, expiringResult) => {
                                if (err) return res.status(500).send("Database error");

                                const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const unpaidSql = `
  SELECT COUNT(*) AS unpaid_users 
  FROM users 
  WHERE role = 'user' 
    AND (invoice IS NULL OR invoice = 'unpaid') 
    AND MONTH(created_at) = ? 
    AND YEAR(created_at) = ?
`;

db.query(unpaidSql, [currentMonth, currentYear], (err, unpaidResult) => {
  if (err) return res.status(500).send("Database error");

  const unpaidUsers = unpaidResult[0].unpaid_users;

  db.query("SELECT * FROM nav_table", (err, bg_result) => {
    if (err) return res.status(500).send("Internal Server Error");
     const successMsg = req.flash("success"); 
                                    res.render("adminIndex/adminIndex", {
                                      user: results,
                                      message: null,
                                      cards: cardResults,
                                      slider: sliderResults,
                                      isAdmin: "admin",
                                      isUser: req.session.user && req.session.user.role === "user",
                                      paymentCount: paymentResult[0].count,
                                      totalUsers: userResult[0].totalUsers,
                                      password_datass,
                                      bg_result,
                                      totalTeam: teamResult[0].totalTeam,
                                      totalRequests: requestResult[0].totalRequests,
                                      totalComplaints: complaintResult[0].totalComplaints,
                                      totalNotifactions: NotifactionResult[0].totalNotifactions,
                                      pendingCount: pendingResult[0].pendingCount,
                                      CompletedCount: CompletedResult[0].CompletedCount,
                                      totalPackages: packageResult[0].totalPackages,
                                      expiringSoon: expiringResult[0].expiringSoon,
                                      unpaidUsers,
                                      Iconresult,
                                      messages: {
                                        success: successMsg.length > 0 ? successMsg[0] : null
                                      }
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
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

// INSERT ONALY ADMIN // INSERT ONALY ADMIN
// Controller to fetch and display cards
exports.getPackages = (req, res) => {
  const sql = "SELECT * FROM cards";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    res.render("your-template-name", { cards: results });
  });
};

// Your existing insert controller (looks good as is)
exports.insertPackagess = (req, res) => {
  const { Package, Price, Speed, Data_Used, Offer_Valid, limits } = req.body;

  const sql = `INSERT INTO cards (Package,Price,Speed,Data_Used,Offer_Valid,limits) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [Package, Price, Speed, Data_Used, Offer_Valid, limits],
    (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }
      req.flash("success", "Package Card added successfully!");
      res.redirect("/adminIndex");
    }
  );
};
// INSERT ONALY ADMIN // INSERT ONALY ADMIN

// update the CARD ONALY THE ADMIN
exports.updatePackage = (req, res) => {
  const userId = req.params.id;
  const { Package, Price, Speed, Data_Used, Offer_Valid, limits } = req.body;
  const sql = `UPDATE cards SET Package = ?, Price = ?, Speed = ?, Data_Used = ?, Offer_Valid = ?, limits = ? WHERE id = ?`;
  db.query(
    sql,
    [Package, Price, Speed, Data_Used, Offer_Valid, limits, userId],
    (err, result) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).send("Internal Server Error");
      }
      req.flash("success", "Package Card updated successfully!");
      res.redirect("/adminIndex");
    }
  );
};

// new data
exports.Newdata = (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).send("Notification ID is required");

  try {
    db.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error marking notification:", error.message);
    res.status(500).send("Server error");
}
};

// Real-time dashboard data endpoint
exports.getDashboardData = (req, res) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Get all dashboard statistics
  Promise.all([
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'", (err, result) => {
        if (err) reject(err);
        else resolve(result[0].totalUsers);
      });
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) AS totalTeam FROM users WHERE role = 'team'", (err, result) => {
        if (err) reject(err);
        else resolve(result[0].totalTeam);
      });
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) AS totalRequests FROM payments", (err, result) => {
        if (err) reject(err);
        else resolve(result[0].totalRequests);
      });
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) AS totalComplaints FROM usercomplaint", (err, result) => {
        if (err) reject(err);
        else resolve(result[0].totalComplaints);
      });
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) AS pendingCount FROM usercomplaint WHERE status = 'Pending'", (err, result) => {
        if (err) reject(err);
        else resolve(result[0].pendingCount);
      });
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) AS CompletedCount FROM usercomplaint WHERE status = 'Complete'", (err, result) => {
        if (err) reject(err);
        else resolve(result[0].CompletedCount);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(`
        SELECT COUNT(*) AS expiringSoon 
        FROM payments 
        WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result[0].expiringSoon);
      });
    }),
    new Promise((resolve, reject) => {
      const unpaidSql = `
        SELECT COUNT(*) AS unpaid_users 
        FROM users 
        WHERE role = 'user' 
          AND (invoice IS NULL OR invoice = 'unpaid') 
          AND MONTH(created_at) = ? 
          AND YEAR(created_at) = ?
      `;
      db.query(unpaidSql, [currentMonth, currentYear], (err, result) => {
        if (err) reject(err);
        else resolve(result[0].unpaid_users);
      });
    })
  ])
  .then(([totalUsers, totalTeam, totalRequests, totalComplaints, pendingCount, CompletedCount, expiringSoon, unpaidUsers]) => {
    res.json({
      totalUsers,
      totalTeam,
      totalRequests,
      totalComplaints,
      pendingCount,
      CompletedCount,
      expiringSoon,
      unpaidUsers,
      timestamp: new Date().toISOString()
    });
  })
  .catch(error => {
    console.error("❌ Error fetching dashboard data:", error);
    res.status(500).json({ error: "Server error" });
  });
};