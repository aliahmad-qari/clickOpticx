const db = require("../config/db");
const NotificationService = require("../services/notificationService");
const moment = require("moment");

// Get the user's




exports.plan = (req, res) => {
  const userId = req.session.userId;
  const justLoggedIn = req.session.userJustLoggedIn;
  req.session.userJustLoggedIn = false;

  const Justservices = req.session.userservices;
  req.session.userservices = false;

  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }

  const sqlProfile = `SELECT id, Username, Email, plan, invoice, user_img, role, lastName FROM users WHERE id = ?`;

  db.query(sqlProfile, [userId], (err, results) => {
    if (err || results.length === 0) {
      console.error("User not found or DB error:", err);
      return res.status(500).send("Internal Server Error");
    }

    const user = results[0];

    const SliderSql = "SELECT * FROM slider";
    db.query(SliderSql, (err, sliderResults) => {
      if (err) return res.status(500).send("Internal Server Error");

      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, bg_result) => {
        if (err) return res.status(500).send("Internal Server Error");

        const backgroundSql2 = "SELECT * FROM data_entries";
        db.query(backgroundSql2, (err, password_data) => {
          if (err) return res.status(500).send("Internal Server Error");

          const notifCountSql = "SELECT COUNT(*) AS totalNotifactions FROM notifications";
          db.query(notifCountSql, (err, NotifactionResult) => {
            if (err) return res.status(500).send("Internal Server Error");
            const totalNotifactions = NotifactionResult[0].totalNotifactions;

            const unreadNotifSql = `
              SELECT COUNT(*) AS Notifactions 
              FROM notifications_user 
              WHERE user_id = ? AND is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY
            `;
            db.query(unreadNotifSql, [userId], (err, Notifaction) => {
              if (err) return res.status(500).send("Internal Server Error");
              const Notifactions = Notifaction[0].Notifactions;

              const notifDetailsSql = `
                SELECT * FROM notifications_user 
                WHERE user_id = ? AND is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY 
                ORDER BY id DESC
              `;
              db.query(notifDetailsSql, [userId], (err, notifications_users) => {
                if (err) return res.status(500).send("Internal Server Error");

                const packageSql = "SELECT * FROM packages";
                db.query(packageSql, (err, packageResults) => {
                  if (err) return res.status(500).send("Internal Server Error");

                  const subscriptionSql = `
                    SELECT * FROM payments 
                    WHERE user_id = ? 
                    ORDER BY id DESC 
                    LIMIT 1
                  `;
                  db.query(subscriptionSql, [userId], (err, subscriptionResults) => {
                    if (err) return res.status(500).send("Internal Server Error");

                    const subscription = subscriptionResults.length > 0 ? subscriptionResults[0] : null;

                    let matchedPackage = null;
                    if (subscription?.package_name) {
                      matchedPackage = packageResults.find(
                        (pkg) => pkg.Package === subscription.package_name
                      ) || null;
                    }

                    // Format expiry
                    const formattedDate = subscription?.expiry
                      ? new Date(subscription.expiry).toLocaleDateString("en-GB")
                      : "--";

                    if (subscription) {
                      user.invoice_status = subscription.invoice_status || "Unpaid";
                      user.package_status = subscription.package_status || "Pending";
                      user.expiry = subscription.expiry || null;

                      // Check expiry status
                      const today = moment();
                      const expiryDate = moment(subscription.expiry);
                      const isExpired =
                        user.package_status.toLowerCase() === "active" &&
                        user.invoice_status.toLowerCase() === "paid" &&
                        expiryDate.isBefore(today, "day");

                      user.isExpired = isExpired;
                    } else {
                      user.invoice_status = "Unpaid";
                      user.package_status = null;
                      user.expiry = null;
                      user.isExpired = false;
                    }

                    const sqlIcon = "SELECT * FROM icon_slider";
                    db.query(sqlIcon, (err, Iconresult) => {
                      if (err) return res.status(500).send("Internal Server Error");

                      const promot = "SELECT * FROM promotions ORDER BY id DESC";
                      db.query(promot, (err, promotionresult) => {
                        if (err) return res.status(500).send("Internal Server Error");

                        const Cards = "SELECT * FROM cards";
                        db.query(Cards, (err, cardResults) => {
                          if (err) return res.status(500).send("Internal Server Error");

                          const isAdmin = user.role === "admin";
                          const isUser = user.role === "user";
                          const isteam = user.role === "Team";

                          res.render("index", {
                            user,
                            slider: sliderResults,
                            isAdmin,
                            isUser,
                            isteam,
                            cards: cardResults,
                            password_data, // ✅ fixed here
                            totalNotifactions,
                            bg_result,
                            Iconresult,
                            packages: packageResults,
                            subscription,
                            matchedPackage,
                            formattedDate,
                            notifications_users,
                            Notifactions,
                            promotionresult,
                            userJustLoggedIn: justLoggedIn,
                            userservices: Justservices
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




// update the Nav_br img // update the Nav_bar img // update the Nav_bar img
exports.updateNav_img = (req, res) => {
  const userId = req.session.userId;
  const userRole = req.session.userRole;

  if (!userId || userRole !== "admin") {
    return res.redirect("/index");
  }

  if (!req.file) {
    console.error("No image uploaded.");
    return res.status(400).send("No image uploaded.");
  }

  const newNavImg = req.file.filename;

  const sqlUpdate = "UPDATE nav_table SET nav_imgs = ?";
  db.query(sqlUpdate, [newNavImg, userId], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (result.affectedRows === 0) {
      console.error("No admin user found to update.");
      return res.status(404).send("No admin user found.");
    }
    req.session.navImg = newNavImg;
    res.redirect("/HeaderFooter");
  });
};

// update the Nav_br img // update the Nav_bar img // update the Nav_bar img

exports.updateSubscription = async (req, res) => {
  console.log("Received Data:", req.body);

  const { user_id, username, transaction_id, amount, package_name } = req.body;

  if (!user_id || !username || !transaction_id || !amount || !package_name) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
      received: req.body,
    });
  }

  const query = `
      INSERT INTO payments (user_id, username, transaction_id, amount, package_name, created_at) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) 
      ON DUPLICATE KEY UPDATE 
      username = VALUES(username), 
      transaction_id = VALUES(transaction_id), 
      amount = VALUES(amount), 
      package_name = VALUES(package_name), 
      created_at = CURRENT_TIMESTAMP
  `;

  db.query(
    query,
    [user_id, username, transaction_id, amount, package_name],
    async (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      try {
        // Get user email for notification
        const getUserEmailQuery = "SELECT Email FROM users WHERE id = ?";
        db.query(getUserEmailQuery, [user_id], async (emailErr, userResult) => {
          if (emailErr) {
            console.error("❌ Error fetching user email:", emailErr);
          }

          try {
            // Use the new notification service for subscription payment
            await NotificationService.handleNewPayment({
              username: username,
              email: userResult.length > 0 ? userResult[0].Email : null,
              package_name: package_name,
              amount: amount,
            });
          } catch (notificationError) {
            console.error(
              "❌ Error sending subscription notifications:",
              notificationError
            );
          }

          res.redirect("/index");
        });
      } catch (error) {
        console.error("❌ Unexpected error in updateSubscription:", error);
        res.redirect("/index");
      }
    }
  );
};

exports.uploadBackgroundImage = (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.status(401).send("User not authenticated.");
  }

  if (!req.file) {
    console.error("No image uploaded.");
    return res.status(400).send("No image uploaded.");
  }

  const uploadimg = req.file.filename;

  const sqlUpdate = "UPDATE nav_table SET background_img = ?";
  db.query(sqlUpdate, [uploadimg, userId], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "Uploaded background image  successfully!");

    res.redirect("/UserDashboard");
  });
};

// Text Change
exports.updateText = (req, res) => {
  const textColor = req.body.text_color;

  if (!textColor) {
    return res.status(400).send("No text color provided.");
  }

  const textSql = "UPDATE nav_table SET text_color = ?";
  db.query(textSql, [textColor], (err, result) => {
    if (err) {
      console.error("❌ Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "Text color changed successfully!");
    res.redirect("/UserDashboard");
  });
};
// Text Change

// Icon Change Slider
exports.updateIcon = (req, res) => {
  const Icon = req.file.filename;
  const Link = req.body.Link;
  if (!Icon || !Link) {
    return res.status(400).send("Icon and Link are required.");
  }
  const sqlIcon = "INSERT INTO icon_slider (icon, link) VALUES (?, ?)";

  db.query(sqlIcon, [Icon, Link], (err, Iconresult) => {
    if (err) {
      console.error(" Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    res.redirect("/HeaderFooter");
  });
};

// Icon Change Slider

// delete background image
exports.deleteBackgroundImage = (req, res) => {
  const sql = "UPDATE nav_table SET background_img = NULL";
  db.query(sql, (err) => {
    if (err) {
      return res.status(500).send("Internal Server Error, not deleted image");
    }
  });
  req.flash("success", "Background image deleted successfully!");
  res.redirect("/UserDashboard");
};

// background color change
exports.updatebackgroundcolor = (req, res) => {
  const backgroundColor = req.body.background_color;

  if (!backgroundColor) {
    return res.status(400).send("No background color provided.");
  }

  const backgroundText = "UPDATE nav_table SET background_color = ?";
  db.query(backgroundText, [backgroundColor], (err, result) => {
    if (err) {
      console.error("❌ Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    req.flash("success", "Background  color changed successfully!");

    res.redirect("/UserDashboard");
  });
};
// background color change

exports.updateLogoText = (req, res) => {
  let logoText = req.body.logo_text;
  if (!logoText) {
    console.log("no text is changed");
  }
  const logoTextSql = "update nav_table set logo_text = ?";
  db.query(logoTextSql, [logoText], (err, result) => {
    if (err) {
      console.error("❌ Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "Logo changed successfully!");

    res.redirect("/HeaderFooter");
  });
};
// Text Change

// new data
exports.NewNoti = (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).send("Notification ID is required");

  try {
    db.query("UPDATE notifications_user SET is_read = 1 WHERE id = ?", [id]);
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error marking notification:", error.message);
    res.status(500).send("Server error");
  }
};
