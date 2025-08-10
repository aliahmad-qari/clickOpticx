const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Upload profile picture of user

// Get Profile Controller
exports.profile = (req, res) => {
  const userId = req.session.userId;
  const user_id = req.session.userId;

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

                  //data to the table
                  const fibre_formssQL =
                    "SELECT * FROM fibre_form_submissions WHERE user_id = ?";
                  db.query(fibre_formssQL, [user_id], (err, fibreData) => {
                    if (err) {
                      console.error("Database query error:", err);
                      return res.status(500).send("Internal Server Error");
                    }
                    //data to the table
                    const wireless_formssQL =
                      "SELECT * FROM wireless_forms WHERE user_id = ?";
                    db.query(
                      wireless_formssQL,
                      [user_id],
                      (err, wirelessData) => {
                        if (err) {
                          console.error("Database query error:", err);
                          return res.status(500).send("Internal Server Error");
                        }

                        // 👇 Flash messages here
                        const successMsg = req.flash("success");

                        const isAdmin = userResults[0].role === "admin";
                        const isUser = userResults[0].role === "user";

                        res.render("profile/profile", {
                          user: userResults[0],
                          isAdmin,
                          bg_result,
                          password_data,
                          messages: {
                            success:
                              successMsg.length > 0 ? successMsg[0] : null,
                          },
                          totalNotifactions,
                          isUser,
                          notifications_users,
                          Notifactions,
                          fibreData,
                          wirelessData,
                        });
                      }
                    );
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

exports.password = (req, res) => {
  const { username, field1, field2 } = req.body;
  const message = "Request for change password.";

  // 1. Insert form data into data_entries
  const sqlData = `
    INSERT INTO data_entries (username, field1, field2)
    VALUES (?, ?, ?)
  `;

  db.query(sqlData, [username, field1, field2], (err, result) => {
    if (err) {
      console.error("❌ SQL Error (data_entries):", err);
      req.flash("error", "Error saving to data_entries table.");
      return res.redirect("/profile");
    }

    // 2. Insert message into notifications table
    const sqlNotif = `
      INSERT INTO notifications (username, message, field2)
      VALUES (?, ?, ?)
    `;

    db.query(sqlNotif, [username, message, field2], (err, notifResult) => {
      if (err) {
        console.error("❌ SQL Error (notifications):", err);
        req.flash("error", "Error saving to notifications table.");
        return res.redirect("/changepassword");
      }

      req.flash("success", "Request has been submitted");
      res.redirect("/profile");
    });
  });
};

exports.updateUser = (req, res) => {
  const {
    Username,
    lastName,
    Email,
    address,
    cnic,
    phoneNumber,
    userId,
    existing_img,
  } = req.body;

  // ✅ Log the uploaded file
  console.log("Uploaded file:", req.file);

  // ✅ Get Cloudinary URL or fallback to existing image
  const userimg = req.file ? req.file.path : existing_img;

  // Log the parameters before query
  console.log("UpdateUser params:", {
    Username,
    lastName,
    Email,
    address,
    cnic,
    phoneNumber,
    userimg,
    userId,
  });

  const sql = `
    UPDATE users 
    SET 
      Username = ?, 
      lastName = ?, 
      Email = ?, 
      address = ?, 
      cnic = ?, 
      Number = ?, 
      user_img = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [Username, lastName, Email, address, cnic, phoneNumber, userimg, userId],
    (err, result) => {
      if (err) {
        console.error("Error updating user:", err);
        return res.status(500).send("Database update failed.");
      }
      console.log("Update successful:", result);
      req.flash("success", "Profile updated successfully!");
      res.redirect("/profile");
    }
  );
};



exports.updatePassword = (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    req.flash("error_msg", "User not authenticated. Please log in again.");
    return res.redirect("/sign_in");
  }

  const { password, newPassword, confirmPassword } = req.body;

  // Validate required fields
  if (!password || !newPassword || !confirmPassword) {
    req.flash("error_msg", "All fields are required.");
    return res.redirect("/profile");
  }

  // Check if new passwords match
  if (newPassword !== confirmPassword) {
    req.flash("error_msg", "New passwords do not match.");
    return res.redirect("/profile");
  }

  // Fetch the user from the database
  const sql = "SELECT * FROM users WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      req.flash("error_msg", "Internal Server Error");
      return res.redirect("/profile");
    }
    if (result.length === 0) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/profile");
    }

    const user = result[0];

    // Compare the current password with the stored hash
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error("Password comparison error:", err);
        req.flash("error_msg", "Internal Server Error");
        return res.redirect("/profile");
      }
      if (!isMatch) {
        req.flash("error_msg", "Incorrect current password.");
        return res.redirect("/profile");
      }

      // Hash the new password
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error("Password hashing error:", err);
          req.flash("error_msg", "Internal Server Error");
          return res.redirect("/profile");
        }

        // Update the password in the database
        const updateSql = "UPDATE users SET password = ? WHERE id = ?";
        db.query(updateSql, [hashedPassword, userId], (err, updateResult) => {
          if (err) {
            console.error("Database update error:", err);
            req.flash("error_msg", "Internal Server Error");
            return res.redirect("/profile");
          }
          req.flash("success_msg", "Password updated successfully.");
          res.redirect("/profile");
        });
      });
    });
  });
};
