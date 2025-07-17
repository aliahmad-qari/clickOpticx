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

  const sqlProfile =
    "SELECT username, Email, plan, invoice, transaction_id,expiry, user_img, amount, role FROM users WHERE role='user'";

  db.query(sqlProfile, [userId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    const Cards = "SELECT * FROM cards";
    db.query(Cards, (err, cardResults) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      // ✅ Only unread notifications from the last 2 days
      const passwordSql = `
        SELECT * FROM notifications 
        WHERE is_read = 0 
          AND created_at >= NOW() - INTERVAL 2 DAY 
        ORDER BY id DESC
      `;
      db.query(passwordSql, (err, password_datass) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }
        // ✅ Only unread notifications from the last 2 days

        // icon
        const sqlIcon = "SELECT * FROM icon_slider";
        db.query(sqlIcon, (err, Iconresult) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Internal Server Error");
          }
          // icon

          const queryPayments = "SELECT COUNT(*) AS count FROM payments";
          db.query(queryPayments, (err, paymentResult) => {
            if (err) {
              console.error("Error fetching payment count:", err);
              return res.status(500).send("Database error");
            }

            const queryTotalUsers =
              "SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'";
            db.query(queryTotalUsers, (err, userResult) => {
              if (err) {
                console.error("Error fetching total users:", err);
                return res.status(500).send("Database error");
              }

              const queryTotalTeam =
                "SELECT COUNT(*) AS totalTeam FROM users WHERE role = 'team'";
              db.query(queryTotalTeam, (err, teamResult) => {
                if (err) {
                  console.error("Error fetching total team members:", err);
                  return res.status(500).send("Database error");
                }

                const queryTotalRequests =
                  "SELECT COUNT(*) AS totalRequests FROM payments";
                db.query(queryTotalRequests, (err, requestResult) => {
                  if (err) {
                    console.error("Error fetching total requests:", err);
                    return res.status(500).send("Database error");
                  }

                  const queryTotalComplaints =
                    "SELECT COUNT(*) AS totalComplaints FROM usercomplaint";
                  db.query(queryTotalComplaints, (err, complaintResult) => {
                    if (err) {
                      console.error("Error fetching total complaints:", err);
                      return res.status(500).send("Database error");
                    }

                    // ✅ Total notifications count (used in badge)
                    const NotifactionSql =
                      "SELECT COUNT(*) AS totalNotifactions FROM notifications WHERE is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY";
                    db.query(NotifactionSql, (err, NotifactionResult) => {
                      if (err) {
                        console.error(
                          "Error fetching total notifications:",
                          err
                        );
                        return res.status(500).send("Database error");
                      }
                      // ✅ Total notifications count (used in badge)

                      const queryPendingComplaints =
                        "SELECT COUNT(*) AS pendingCount FROM usercomplaint WHERE status = 'Pending'";
                      const queryCompletedComplaints =
                        "SELECT COUNT(*) AS CompletedCount FROM usercomplaint WHERE status = 'Complete'";

                      db.query(queryPendingComplaints, (err, pendingResult) => {
                        if (err) {
                          console.error(
                            "Error fetching pending complaints:",
                            err
                          );
                          return res.status(500).send("Database error");
                        }

                        db.query(
                          queryCompletedComplaints,
                          (err, CompletedResult) => {
                            if (err) {
                              console.error(
                                "Error fetching completed complaints:",
                                err
                              );
                              return res.status(500).send("Database error");
                            }

                            let sqlPackages =
                              "SELECT COUNT(*) AS totalPackages FROM packages";
                            db.query(sqlPackages, (err, packageResult) => {
                              if (err) {
                                console.error(
                                  "Error fetching total packages:",
                                  err
                                );
                                return res.status(500).send("Database error");
                              }

                              const SliderSql = "SELECT * FROM slider";
                              db.query(SliderSql, (err, sliderResults) => {
                                if (err) {
                                  console.error("Database query error:", err);
                                  return res
                                    .status(500)
                                    .send("Internal Server Error");
                                }

                                let sqlExpiring = `
                              SELECT COUNT(*) AS expiringSoon FROM payments 
                              WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                            `;
                                db.query(sqlExpiring, (err, expiringResult) => {
                                  if (err) {
                                    console.error(
                                      "Error fetching expiring payments:",
                                      err
                                    );
                                    return res
                                      .status(500)
                                      .send("Database error");
                                  }

                                  const sqlUnpaidUsers = `
                                SELECT COUNT(*) AS unpaid_users 
                                FROM users 
                                WHERE role = 'user' AND invoice = 'unpaid'
                              `;

                                  db.query(
                                    sqlUnpaidUsers,
                                    (err, unpaidResult) => {
                                      if (err) {
                                        return res
                                          .status(500)
                                          .json({ error: err.message });
                                      }

                                      const backgroundSql =
                                        "SELECT * FROM nav_table";
                                      db.query(
                                        backgroundSql,
                                        (err, bg_result) => {
                                          if (err) {
                                            console.error(
                                              "Database query error:",
                                              err
                                            );
                                            return res
                                              .status(500)
                                              .send("Internal Server Error");
                                          }

                                          const unpaidUsers =
                                            unpaidResult[0].unpaid_users;
                                          const paymentCount =
                                            paymentResult[0].count;
                                          const totalUsers =
                                            userResult[0].totalUsers;
                                          const totalTeam =
                                            teamResult[0].totalTeam;
                                          const totalRequests =
                                            requestResult[0].totalRequests;
                                          const totalComplaints =
                                            complaintResult[0].totalComplaints;
                                          const pendingCount =
                                            pendingResult[0].pendingCount;
                                          const CompletedCount =
                                            CompletedResult[0].CompletedCount;
                                          const totalPackages =
                                            packageResult[0].totalPackages;
                                          const expiringSoon =
                                            expiringResult[0].expiringSoon;
                                          const totalNotifactions =
                                            NotifactionResult[0]
                                              .totalNotifactions;
                                          const isAdmin = "admin";
                                          const isUser =
                                            req.session.user &&
                                            req.session.user.role === "user";

                                          const successMsg =
                                            req.flash("success");
                                          res.render("adminIndex/adminIndex", {
                                            user: results,
                                            message: null,
                                            cards: cardResults,
                                            slider: sliderResults,
                                            isAdmin,
                                            isUser,
                                            paymentCount,
                                            totalUsers,
                                            password_datass,
                                            bg_result,
                                            totalTeam,
                                            totalRequests,
                                            totalComplaints,
                                            totalNotifactions,
                                            pendingCount,
                                            CompletedCount,
                                            totalPackages,
                                            expiringSoon,
                                            unpaidUsers,
                                            Iconresult,
                                            messages: {
                                              success:
                                                successMsg.length > 0
                                                  ? successMsg[0]
                                                  : null,
                                            },
                                          });
                                        }
                                      );
                                    }
                                  );
                                });
                              });
                            });
                          }
                        );
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
    res.status(500).send("Server error");
}
};