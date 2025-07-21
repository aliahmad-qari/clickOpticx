const db = require("../config/db");
const sql = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require("crypto");

exports.loginPage = (req, res) => {
  const query = 'SELECT nav_imgs FROM your_table_name LIMIT 1';

  connection.query(query, (err, bg_result) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).send('Internal Server Error');
    }

    // ✅ Render login.ejs and pass bg_result
    res.render('login/login', { bg_result }); // 👈 THIS IS IMPORTANT
  });
};
exports.profile = (req, res) => {

    const query = "SELECT COUNT(*) AS count FROM payments";
    db.query(query, (err, paymentResult) => {
      if (err) {
        console.error("Error fetching payment count:", err);
        return res.status(500).send("Database error");
      }

      const paymentCount = paymentResult[0].count;

      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, bg_result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }
        
        const isUser = req.session.user && req.session.user.role === "user";

        // ✅ New: Total unread notifications in the past 2 days
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

          const totalNotifactions = NotifactionResult[0].totalNotifactions;

          // ✅ New: Detailed unread notifications
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

            // 👇 Flash messages here
            const successMsg = req.flash("success");

            res.render("login/login", {
    
              message: null,
           
              paymentCount,
              bg_result,
              messages: {
                success: successMsg.length > 0 ? successMsg[0] : null,
              },
              totalNotifactions,
              password_datass,
            });
          });
        });
      });
    });
};

exports.register = (req, res) => {

    const query = "SELECT COUNT(*) AS count FROM payments";
    db.query(query, (err, paymentResult) => {
      if (err) {
        console.error("Error fetching payment count:", err);
        return res.status(500).send("Database error");
      }

      const paymentCount = paymentResult[0].count;

      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, bg_result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }
        
        const isUser = req.session.user && req.session.user.role === "user";

        // ✅ New: Total unread notifications in the past 2 days
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

          const totalNotifactions = NotifactionResult[0].totalNotifactions;

          // ✅ New: Detailed unread notifications
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

            // 👇 Flash messages here
            const successMsg = req.flash("success");

            res.render("login/register", {

              message: null,
           
              paymentCount,
              bg_result,
              messages: {
                success: successMsg.length > 0 ? successMsg[0] : null,
              },
              totalNotifactions,
              password_datass,
            });
          });
        });
      });
    });
};

// signup Controller


exports.signup = (req, res) => {
  const { Username, Email, password } = req.body;

  // Check if email already exists
  const checkEmailSql = "SELECT * FROM users WHERE Email = ?";
  db.query(checkEmailSql, [Email], (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (results.length > 0) {
      return res.render("login/register", {
        message: "Email already exists. Try another one.",
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ error: "Hash error" });

      // Insert user
      const sql = `INSERT INTO users (Username, Email, password, verification_token, user_verified)
                   VALUES (?, ?, ?, ?, 0)`;
      db.query(sql, [Username, Email, hashedPassword, verificationToken], (err) => {
        if (err) return res.status(500).json({ error: "User insert error" });

        // Email setup
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "hamzahayat3029@gmail.com",
            pass: "ceud ztsg vqwr lmtl",
          },
        });

        const verifyUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;
        const mailOptions = {
          from: "hamzahayat3029@gmail.com",
          to: Email,
          subject: "Verify Your Email",
          html: `<h2>Welcome, ${Username}!</h2>
                 <p>Click below to verify your account:</p>
                 <a href="${verifyUrl}">${verifyUrl}</a>`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error("Email error:", err);
            return res.status(500).send("Signup complete but email failed.");
          }

          // After email is sent
          const bgSql = "SELECT * FROM nav_table";
db.query(bgSql, (err, bg_result) => {
  if (err) {
    console.error("Background error:", err);
    return res.status(500).send("Internal Server Error");
  }

  res.render("login/login", {
    message: "Account created! Check your email to verify.",
    bg_result,
  });
});

        });
      });
    });
  });
};
exports.verifyEmail = (req, res) => {
  const { token } = req.query;

  const findUserSql = "SELECT * FROM users WHERE verification_token = ?";
  db.query(findUserSql, [token], (err, results) => {
    if (err) return res.status(500).send("Server error");
    if (results.length === 0) return res.status(400).send("Invalid or expired token");

    const updateSql = `UPDATE users 
                       SET user_verified = 1, verification_token = NULL 
                       WHERE verification_token = ?`;
    db.query(updateSql, [token], (err) => {
      if (err) return res.status(500).send("Could not verify email");

     const bgSql = "SELECT * FROM nav_table";
db.query(bgSql, (err, bg_result) => {
  if (err) {
    console.error("Background error:", err);
    return res.status(500).send("Internal Server Error");
  }

  res.render("login/login", {
    message: "✅ Email verified successfully. Please login.",
    bg_result, // ✅ bg_result defined here
  });
});

    });
  });
};

// Signin Controller
exports.signin = [
  (req, res) => {
    req.session.userJustLoggedIn = true;
    req.session.userservices = true;

    const { Email, password } = req.body;
    const sql = "SELECT * FROM users WHERE Email = ?";

    db.query(sql, [Email], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (bgErr, bg_result) => {
        if (bgErr) {
          console.error("Database query error:", bgErr);
          return res.status(500).send("Internal Server Error");
        }

        if (result.length === 0) {
          req.flash("error", "Invalid Email.");
          return res.render("login/login", {
            message: req.flash("error"),
            bg_result
          });
        }

        const user = result[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err || !isMatch) {
            req.flash("error", "Invalid password.");
            return res.render("login/login", {
              message: req.flash("error"),
              bg_result
            });
          }

          req.session.userId = user.id;
          req.session.userRole = user.role;

          const token = jwt.sign({ id: user.id }, "your_jwt_secret", {
            expiresIn: "1h",
          });

          res.cookie("auth_token", token, { httpOnly: true });

          if (user.role === "user" && user.first_time_login) {
            return res.render("login/first-time-selection", {
              username: user.Username,
              userEmail: user.Email,
              selectedForm: user.selected_form || null,
              bg_result,
            });
          }

          if (user.role === "admin") return res.redirect("/adminIndex");
          if (user.role === "Team") return res.redirect("/UserComplaint");

          return res.redirect("/index");
        });
      });
    });
  },
];


// Handle form selection
exports.selectForm = (req, res) => {
  const { email, formType } = req.body;

  const updateQuery = `
    UPDATE users
    SET first_time_login = false, selected_form = ?
    WHERE Email = ?
  `;

  db.query(updateQuery, [formType, email], (err) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).send("Database error");
    }

    res.render("login/first-time-selection", {
      username: req.session.username,
      userEmail: email,
      selectedForm: formType,
    });
  });
};

// Submit Fibre Form
exports.submitFibreForm = (req, res) => {
  const user_id = req.session.userId;
  const isSkip = req.body.skip === "true";
  const {
    email, device_label, device_price, first_package_price,
    fibre_power_label, fibre_power_price, fibre_color_value, fibre_supplying_value,
    cable_core, cable_meter, cable_quantity, cable_price, splitter_value,
    duck_patti_quantity, duck_patti_price, patch_card_quantity, patch_card_price
  } = req.body;


  // Handle fibre_power_label (array or string)
  let finalFibrePowerLabel = null;
  if (Array.isArray(fibre_power_label)) {
    finalFibrePowerLabel = fibre_power_label.find(val => val && val !== 'custom') || null;
  } else {
    finalFibrePowerLabel = fibre_power_label && fibre_power_label !== 'custom' ? fibre_power_label : null;
  }

  if (isSkip) {
    const insertQuery = `
      INSERT INTO fibre_form_submissions (
        user_id, email, formType, device_label, device_price, first_package_price,
        fibre_power_label, fibre_power_price, fibre_color_value, fibre_supplying_value,
        cable_core, cable_meter, cable_quantity, cable_price, splitter_value,
        duck_patti_quantity, duck_patti_price, patch_card_quantity, patch_card_price,
        user_pay, company_pay
      ) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    `;
    db.query(insertQuery, [user_id, email, 'fibre'], (err) => {
      if (err) {
        console.error('[submitFibreForm] Error inserting fibre form:', err);
        return res.status(500).send('Database error while saving the form.');
      }
      updateUserAndRedirect();
    });
  } else {
    if (!email) {
      return res.status(400).send('Missing required field: email');
    }

    // Insert submission
    const insertQuery = `
      INSERT INTO fibre_form_submissions (
        user_id, email, formType, device_label, device_price, first_package_price,
        fibre_power_label, fibre_power_price, fibre_color_value, fibre_supplying_value,
        cable_core, cable_meter, cable_quantity, cable_price, splitter_value,
        duck_patti_quantity, duck_patti_price, patch_card_quantity, patch_card_price,
        user_pay, company_pay
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      user_id,
      email,
      'fibre',
      device_label || null,
      device_price || null,
      first_package_price || null,
      finalFibrePowerLabel,
      fibre_power_price || null,
      fibre_color_value || null,
      fibre_supplying_value || null,
      cable_core || null,
      cable_meter || null,
      cable_quantity || null,
      cable_price || null,
      splitter_value || null,
      duck_patti_quantity || null,
      duck_patti_price || null,
      patch_card_quantity || null,
      patch_card_price || null,
      null, // user_pay
      null  // company_pay
    ];
    db.query(insertQuery, values, (err) => {
      if (err) {
        console.error('[submitFibreForm] Error inserting fibre form:', err);
        return res.status(500).send('Database error while saving the form.');
      }
      updateUserAndRedirect();
    });
  }

  function updateUserAndRedirect() {
    const updateQuery = `
      UPDATE users
      SET first_time_login = false, selected_form = ?
      WHERE Email = ?
    `;
    db.query(updateQuery, ['fibre', email], (err) => {
      if (err) {
        console.error('[submitFibreForm] Error updating user:', err);
        return res.status(500).send('Database error updating user.');
      }
      db.query('SELECT username FROM users WHERE Email = ?', [email], (err2, results) => {
      if (err2 || results.length === 0) {
        console.error('[submitFibreForm] Failed to get username for notification:', err2);
        return res.redirect('/index'); // Continue redirecting even if notification fails
      }

      const username = results[0].username;
        const message = isSkip
          ? `${username} skipped the fibre form`
          : `${username} submitted the Fibre form`;

      const notifQuery = `INSERT INTO notifications (username, message, is_read) VALUES (?, ?, 0)`;
      db.query(notifQuery, [username, message], (err3) => {
        if (err3) {
          console.error('[submitFibreForm] Error inserting notification:', err3);
        }

      res.redirect('/index');
    });
  });
});
}
};
// Submit Wireless Form
exports.submitWirelessForm = (req, res) => {
  const user_id = req.session.userId;
  const isSkip = req.body.skip === "true";
  const {
    email, cat6_quantity, cat6_price, first_package_price,
    clips_quantity, clips_price, raval_bold_pair, raval_bold_price,
    poll_height, poll_price, signal_strength, home_tower_height,
    signal_receiver, receiver_price, receiver_model, wifi_onu,
    onu_price, onu_model, tower_ap_device, wireless_field
  } = req.body;

  if (isSkip) {
    console.log('[submitWirelessForm] Skipping form submission');
    const insertQuery = `
      INSERT INTO wireless_forms (
        user_id, email, formType, cat6_quantity, cat6_price, first_package_price,
        clips_quantity, clips_price, raval_bold_pair, raval_bold_price,
        poll_height, poll_price, signal_strength, home_tower_height,
        signal_receiver, receiver_price, receiver_model, wifi_onu,
        onu_price, onu_model, tower_ap_device, wireless_field,
        user_pay, company_pay
      ) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    `;
    db.query(insertQuery, [user_id, email, 'wireless'], (err) => {
      if (err) {
        console.error('[submitWirelessForm] Error inserting wireless form:', err);
        return res.status(500).send('Database error while saving the form.');
      }
      updateUserAndRedirect();
    });
  } else {
    // Validate required field (only email is mandatory)
    if (!email) {
      console.log('[submitWirelessForm] Validation failed: Missing email');
      return res.status(400).send('Missing required field: email');
    }

    // Handle "Other" selections
    let finalSignalReceiver = signal_receiver;
    let finalWifiOnu = wifi_onu;
    let finalTowerApDevice = tower_ap_device;

    if (signal_receiver === 'Other') {
      finalSignalReceiver = receiver_model || 'Other';
    }
    if (wifi_onu === 'Other') {
      finalWifiOnu = onu_model || 'Other';
    }
    if (tower_ap_device === 'Other') {
      finalTowerApDevice = 'Other';
    }

    // Insert submission
    const insertQuery = `
      INSERT INTO wireless_forms (
        user_id, email, formType, cat6_quantity, cat6_price, first_package_price,
        clips_quantity, clips_price, raval_bold_pair, raval_bold_price,
        poll_height, poll_price, signal_strength, home_tower_height,
        signal_receiver, receiver_price, receiver_model, wifi_onu,
        onu_price, onu_model, tower_ap_device, wireless_field,
        user_pay, company_pay
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      user_id,
      email,
      'wireless',
      cat6_quantity || null,
      cat6_price || null,
      first_package_price || null,
      clips_quantity || null,
      clips_price || null,
      raval_bold_pair || null,
      raval_bold_price || null,
      poll_height || null,
      poll_price || null,
      signal_strength ? `${signal_strength}-dBi` : null,
      home_tower_height || null,
      finalSignalReceiver || null,
      receiver_price || null,
      receiver_model || null,
      finalWifiOnu || null,
      onu_price || null,
      onu_model || null,
      finalTowerApDevice || null,
      wireless_field || null,
      null, // user_pay
      null  // company_pay
    ];
    console.log('[submitWirelessForm] Inserting wireless form');
    db.query(insertQuery, values, (err) => {
      if (err) {
        console.error('[submitWirelessForm] Error inserting wireless form:', err);
        return res.status(500).send('Database error while saving the form.');
      }
      updateUserAndRedirect();
    });
  }

  function updateUserAndRedirect() {
    const updateQuery = `
      UPDATE users
      SET first_time_login = false, selected_form = ?
      WHERE Email = ?
    `;
    console.log('[submitWirelessForm] Updating user and redirecting');
    db.query(updateQuery, ['wireless', email], (err) => {
      if (err) {
        console.error('[submitWirelessForm] Error updating user:', err);
        return res.status(500).send('Database error updating user.');
      }
      console.log('[submitWirelessForm] User updated, redirecting to /index');
      db.query('SELECT username FROM users WHERE Email = ?', [email], (err2, results) => {
      if (err2 || results.length === 0) {
        console.error('[submitFibreForm] Failed to get username for notification:', err2);
        return res.redirect('/index');
      }

      const username = results[0].username;
        const message = isSkip
          ? `${username} skipped the Wireless form`
          : `${username} submitted the Wireless form`;

      const notifQuery = `INSERT INTO notifications (username, message, is_read) VALUES (?, ?, 0)`;
      db.query(notifQuery, [username, message], (err3) => {
        if (err3) {
          console.error('[submitWirelessForm] Error inserting notification:', err3);
        }
      res.redirect('/index');
    });
  });
});
  }
};

// Skip Forms
exports.skipForms = (req, res) => {
  const { email } = req.body;
  const user_id = req.session.userId;

  const fibreQuery = `
    INSERT INTO fibre_form_submissions (
      user_id, email, formType, device_label, device_price, first_package_price,
      fibre_power_label, fibre_power_price, fibre_color_value, fibre_supplying_value,
      cable_quantity, cable_price, splitter_value, duck_patti_quantity, duck_patti_price,
      patch_card_quantity, patch_card_price
    ) VALUES (?, ?, 'fibre', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
  `;
  const wirelessQuery = `
    INSERT INTO wireless_forms (
      user_id, email, formType, cat6_quantity, cat6_price, first_package_price,
      clips_quantity, clips_price, raval_bold_pair, raval_bold_price,
      poll_height, poll_price, signal_strength, home_tower_height,
      signal_receiver, receiver_price, receiver_model, wifi_onu,
      onu_price, onu_model, tower_ap_device, wireless_field
    ) VALUES (?, ?, 'wireless', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
  `;
  const updateLoginQuery = `UPDATE users SET first_time_login = 0 WHERE email = ?`;

  db.query(fibreQuery, [user_id, email], (err) => {
    if (err) {
      console.error('Error inserting into fibre_form:', err);
      return res.status(500).send('Error inserting into fibre_form');
    }
    db.query(wirelessQuery, [user_id, email], (err) => {
      if (err) {
        console.error('Error inserting into wireless_form:', err);
        return res.status(500).send('Error inserting into wireless_form');
      }
      db.query(updateLoginQuery, [email], (err) => {
        if (err) {
          console.error('Error updating first_time_login:', err);
          return res.status(500).send('Error updating user login status');
        }
        res.status(200).send('Forms skipped successfully');
      });
    });
  });
};

// logout Controller
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/index");
    }
    res.clearCookie("connect.sid");
    res.clearCookie("auth_token");
    res.render("/", {
      message: "You have been logged out successfully.",
    });
  });
};




// forget password // forget password
// Forgot Password - Send OTP
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  const checkEmailSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      console.error("Database error during email check:", err);
      return res.status(500).render("login/login", {
        errorMessage: "Internal server error. Please try again later.",
        showForgotModal: true,
      });
    }

                const backgroundSql = "SELECT * FROM nav_table";
            db.query(backgroundSql, (err, bg_result) => {
              if (err) {
                console.error("Database query error:", err);
                return res.status(500).send("Internal Server Error");
              }

    if (results.length === 0) {
      return res.render("login/login", {
        bg_result,
        errorMessage: "Email not found. Please enter a valid email.",
        showForgotModal: true,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    const updateOtpSql = "UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?";
    db.query(updateOtpSql, [otp, otpExpiry, email], (err) => {
      if (err) {
        console.error("Error updating OTP:", err);
        return res.status(500).render("login/login", {
          bg_result,
          errorMessage: "Could not generate OTP. Please try again.",
          showForgotModal: true,
        });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: "hamzahayat3029@gmail.com",
          pass: "ceud ztsg vqwr lmtl",
        },
      });

      const mailOptions = {
        from: "hamzahayat3029@gmail.com",
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}`,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending OTP email:", err);
          return res.status(500).render("login/login", {
  bg_result,
  errorMessage: "Failed to send OTP email. Please try again.",
  showForgotModal: true,
});

        }

        res.render("login/verify_otp", {
          email,
          message: "OTP Code Sent To Your Email.",
        });
      });
    });
  });
    });
};


exports.verifyOtpAndResetPassword = (req, res) => {
  const { email, otp, newPassword } = req.body;

  const currentTime = Date.now(); // Get current time in milliseconds

  // Select users where OTP matches and it's not expired
  const checkOtpSql = "SELECT * FROM users WHERE email = ? AND otp = ? AND otp_expiry >= ?";
  db.query(checkOtpSql, [email, otp, currentTime], (err, results) => {
    if (err) {
      console.error("Database error during OTP check:", err);
      return res.status(500).json({ error: "Database error during OTP check." });
    }

    if (results.length === 0) {
      console.log("Invalid or expired OTP. No matching record found.");
      return res.render("login/verify_otp", {
        email,
        message: "Invalid or expired OTP. Please try again.",
      });
    }

    // Hash the new password
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.status(500).json({ error: "Error hashing password." });
      }

      const data = "SELECT * FROM nav_table";
      db.query(data, (err, bg_result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }

      // Update password and clear OTP fields
      const updatePasswordSql = "UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?";
      db.query(updatePasswordSql, [hashedPassword, email], (err) => {
        if (err) {
          console.error("Error updating password:", err);
          return res.status(500).json({ error: "Error updating password." });
        }
 if (results.length === 0) {
      return res.render("login/login", {
        bg_result,
        errorMessage: "Email not found. Please enter a valid email.",
        showForgotModal: true,
      });
    }
        res.render("login/login", {
           bg_result,
          message: "Password reset successfully. Please sign in.",
        });
      });
    });
  });
  });
};

// forget password // forget password
