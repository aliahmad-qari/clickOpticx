const db = require("../config/db");
const sql = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require("crypto");

exports.loginPage = (req, res) => {
  const query = 'SELECT nav_imgs FROM your_table_name LIMIT 1';

  db.query(query, (err, bg_result) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).render('login/login', {
        bg_result: [],
        errorMessage: "Internal Server Error. Please try again later.",
        showErrorModal: true,
        showToast: true,
      });
    }
    res.render('login/login', { bg_result, errorMessage: null, showErrorModal: false, showToast: false });
  });
};

exports.profile = (req, res) => {
  const query = "SELECT COUNT(*) AS count FROM payments";
  db.query(query, (err, paymentResult) => {
    if (err) {
      console.error("Error fetching payment count:", err);
      return res.status(500).render("login/login", {
        errorMessage: "Database error. Please try again.",
        showErrorModal: true,
        showToast: true,
      });
    }

    const paymentCount = paymentResult[0].count;

    const backgroundSql = "SELECT * FROM nav_table";
    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).render("login/login", {
          errorMessage: "Internal Server Error. Please try again.",
          showErrorModal: true,
          showToast: true,
        });
      }

      const isUser = req.session.user && req.session.user.role === "user";

      const NotifactionSql = `
        SELECT COUNT(*) AS totalNotifactions 
        FROM notifications 
        WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY
      `;
      db.query(NotifactionSql, (err, NotifactionResult) => {
        if (err) {
          console.error("Error fetching notification count:", err);
          return res.status(500).render("login/login", {
            errorMessage: "Server Error. Please try again.",
            showErrorModal: true,
            showToast: true,
          });
        }

        const totalNotifactions = NotifactionResult[0].totalNotifactions;

        const passwordSql = `
          SELECT * FROM notifications 
          WHERE is_read = 0 
          AND created_at >= NOW() - INTERVAL 2 DAY 
          ORDER BY id DESC
        `;
        db.query(passwordSql, (err, password_datass) => {
          if (err) {
            console.error("Error fetching notification details:", err);
            return res.status(500).render("login/login", {
              errorMessage: "Server Error. Please try again.",
              showErrorModal: true,
              showToast: true,
            });
          }

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
            errorMessage: null,
            showErrorModal: false,
            showToast: false,
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
      return res.status(500).render("login/register", {
        errorMessage: "Database error. Please try again.",
        showErrorModal: true,
        showToast: true,
      });
    }

    const paymentCount = paymentResult[0].count;

    const backgroundSql = "SELECT * FROM nav_table";
    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).render("login/register", {
          errorMessage: "Internal Server Error. Please try again.",
          showErrorModal: true,
          showToast: true,
        });
      }

      const isUser = req.session.user && req.session.user.role === "user";

      const NotifactionSql = `
        SELECT COUNT(*) AS totalNotifactions 
        FROM notifications 
        WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY
      `;
      db.query(NotifactionSql, (err, NotifactionResult) => {
        if (err) {
          console.error("Error fetching notification count:", err);
          return res.status(500).render("login/register", {
            errorMessage: "Server Error. Please try again.",
            showErrorModal: true,
            showToast: true,
          });
        }

        const totalNotifactions = NotifactionResult[0].totalNotifactions;

        const passwordSql = `
          SELECT * FROM notifications 
          WHERE is_read = 0 
          AND created_at >= NOW() - INTERVAL 2 DAY 
          ORDER BY id DESC
        `;
        db.query(passwordSql, (err, password_datass) => {
          if (err) {
            console.error("Error fetching notification details:", err);
            return res.status(500).render("login/register", {
              errorMessage: "Server Error. Please try again.",
              showErrorModal: true,
              showToast: true,
            });
          }

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
            errorMessage: null,
            showErrorModal: false,
            showToast: false,
          });
        });
      });
    });
  });
};

// signup Controller
exports.signup = (req, res) => {
  const { Username, Email, password, cnic, phone } = req.body;

  const checkEmailSql = "SELECT * FROM users WHERE Email = ?";
  db.query(checkEmailSql, [Email], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).render("login/register", {
        errorMessage: "Database error. Please try again.",
        showErrorModal: true,
        showToast: true,
      });
    }

    if (results.length > 0) {
      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (bgErr, bg_result) => {
        if (bgErr) {
          console.error("Error fetching background image:", bgErr);
          return res.status(500).render("login/register", {
            errorMessage: "Internal Server Error. Please try again.",
            showErrorModal: true,
            showToast: true,
          });
        }
        return res.render("login/register", {
          // message: "Email already exists. Try another one.",
          bg_result,
          errorMessage: "Email already exists. Try another one.",
          showErrorModal: true,
          showToast: true,
        });
      });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Hash error:", err);
        return res.status(500).render("login/register", {
          errorMessage: "Error hashing password. Please try again.",
          showErrorModal: true,
          showToast: true,
        });
      }

      const insertSql = `
        INSERT INTO users (Username, Email, cnic, Number, password, verification_token, user_verified)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `;
      db.query(insertSql, [Username, Email, cnic, phone, hashedPassword, verificationToken], (err) => {
        if (err) {
          console.error("Signup failed:", err);
          return res.status(500).render("login/register", {
            errorMessage: "Signup failed. Please try again.",
            showErrorModal: true,
            showToast: true,
          });
        }

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "clickopticx@gmail.com",
            pass: "qjnm esst kuxp kabq",
          },
        });

        const verifyUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;
        const mailOptions = {
          from: "clickopticx@gmail.com",
          to: Email,
          subject: "Verify Your Email",
          html: `<h2>Welcome, ${Username}!</h2>
                 <p>Click below to verify your account:</p>
                 <a href="${verifyUrl}">${verifyUrl}</a>`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error("Email error:", err);
            return res.status(500).render("login/register", {
              errorMessage: "Signup complete but email failed. Please check your email address.",
              showErrorModal: true,
              showToast: true,
            });
          }
          const bgSql = "SELECT * FROM nav_table";
          db.query(bgSql, (err, bg_result) => {
            if (err) {
              console.error("Background error:", err);
              return res.status(500).render("login/login", {
                errorMessage: "Internal Server Error. Please try again.",
                showErrorModal: true,
                showToast: true,
              });
            }

            res.render("login/login", {
              message: "Account created! Check your email to verify.",
              bg_result,
              errorMessage: null,
              showErrorModal: false,
              showToast: true,
            });
          });
        });
      });
    });
  });
};

exports.verifyEmail = (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).render("login/login", {
      errorMessage: "Missing verification token.",
      showErrorModal: true,
      showToast: true,
      bg_result: [] // ✅ added
    });
  }

  const findUserSql = "SELECT * FROM users WHERE verification_token = ?";
  db.query(findUserSql, [token], (err, results) => {
    if (err) {
      console.error("Server error:", err);
      return res.status(500).render("login/login", {
        errorMessage: "Server error. Please try again.",
        showErrorModal: true,
        showToast: true,
        bg_result: [] // ✅ added
      });
    }

    if (results.length === 0) {
      return res.status(400).render("login/login", {
        errorMessage: "Invalid or expired token.",
        showErrorModal: true,
        showToast: true,
        bg_result: [] // ✅ added
      });
    }

    const updateSql = `
      UPDATE users 
      SET user_verified = 1, verification_token = NULL 
      WHERE verification_token = ?
    `;

    db.query(updateSql, [token], (err) => {
      if (err) {
        console.error("Could not verify email:", err);
        return res.status(500).render("login/login", {
          errorMessage: "Could not verify email. Please try again.",
          showErrorModal: true,
          showToast: true,
          bg_result: [] // ✅ added
        });
      }

      const bgSql = "SELECT * FROM nav_table";
      db.query(bgSql, (err, bg_result) => {
        if (err) {
          console.error("Background error:", err);
          return res.status(500).render("login/login", {
            errorMessage: "Internal Server Error. Please try again.",
            showErrorModal: true,
            showToast: true,
            bg_result: [] // ✅ added as fallback
          });
        }

        res.render("login/login", {
          message: "✅ Email verified successfully. Please login.",
          bg_result,
          errorMessage: null,
          showErrorModal: false,
          showToast: true,
        });
      });
    });
  });
};


// Signin Controller
// Signin Controller
exports.signin = [
  (req, res) => {
    req.session.userJustLoggedIn = true;
    req.session.userservices = true;

    const { Email, password } = req.body;
    const sql = "SELECT * FROM users WHERE Email = ?";

    db.query(sql, [Email], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).render("login/login", {
          errorMessage: "Database error. Please try again.",
          showErrorModal: true,
          showToast: true,
        });
      }

      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (bgErr, bg_result) => {
        if (bgErr) {
          console.error("Database query error:", bgErr);
          return res.status(500).render("login/login", {
            errorMessage: "Internal Server Error. Please try again.",
            showErrorModal: true,
            showToast: true,
          });
        }

        if (result.length === 0) {
          req.flash("error", "Invalid Email.");
          return res.render("login/login", {
            message: req.flash("error"),
            bg_result,
            errorMessage: "Invalid Email.",
            showErrorModal: true,
            showToast: true,
          });
        }

        const user = result[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err || !isMatch) {
            req.flash("error", "Invalid password.");
            return res.render("login/login", {
              message: req.flash("error"),
              bg_result,
              errorMessage: "Invalid password.",
              showErrorModal: true,
              showToast: true,
            });
          }

          // 🚫 Check if user is verified
          if (user.user_verified !== 1) {
            return res.render("login/login", {
              message: null,
              bg_result,
              errorMessage: "Please verify your email before logging in.",
              showErrorModal: true,
              showToast: true,
            });
          }

          // ✅ Email is verified, proceed with login
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
              errorMessage: null,
              showErrorModal: false,
              showToast: false,
            });
          }

          if (user.role === "admin") return res.redirect("/adminIndex");
          if (user.role === "Team") return res.redirect("/UserComplaint");

          return res.redirect("/index");
        }); // <-- Closing bcrypt.compare
      });   // <-- Closing nav_table query
    });     // <-- Closing users Email query
  }         // <-- Closing function(req, res)
];          // <-- Closing exports.signin array


       

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
      return res.status(500).render("login/first-time-selection", {
        errorMessage: "Database error. Please try again.",
        showErrorModal: true,
        showToast: true,
      });
    }

    res.render("login/first-time-selection", {
      username: req.session.username,
      userEmail: email,
      selectedForm: formType,
      errorMessage: null,
      showErrorModal: false,
      showToast: true,
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
        return res.status(500).render("login/first-time-selection", {
          errorMessage: "Database error while saving the form.",
          showErrorModal: true,
          showToast: true,
        });
      }
      updateUserAndRedirect();
    });
  } else {
    if (!email) {
      return res.status(400).render("login/first-time-selection", {
        errorMessage: "Missing required field: email",
        showErrorModal: true,
        showToast: true,
      });
    }

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
      null,
      null
    ];
    db.query(insertQuery, values, (err) => {
      if (err) {
        console.error('[submitFibreForm] Error inserting fibre form:', err);
        return res.status(500).render("login/first-time-selection", {
          errorMessage: "Database error while saving the form.",
          showErrorModal: true,
          showToast: true,
        });
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
        return res.status(500).render("login/first-time-selection", {
          errorMessage: "Database error updating user.",
          showErrorModal: true,
          showToast: true,
        });
      }
      db.query('SELECT username FROM users WHERE Email = ?', [email], (err2, results) => {
        if (err2 || results.length === 0) {
          console.error('[submitFibreForm] Failed to get username for notification:', err2);
          return res.redirect('/index');
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
        return res.status(500).render("login/first-time-selection", {
          errorMessage: "Database error while saving the form.",
          showErrorModal: true,
          showToast: true,
        });
      }
      updateUserAndRedirect();
    });
  } else {
    if (!email) {
      return res.status(400).render("login/first-time-selection", {
        errorMessage: "Missing required field: email",
        showErrorModal: true,
        showToast: true,
      });
    }

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
      null,
      null
    ];
    db.query(insertQuery, values, (err) => {
      if (err) {
        console.error('[submitWirelessForm] Error inserting wireless form:', err);
        return res.status(500).render("login/first-time-selection", {
          errorMessage: "Database error while saving the form.",
          showErrorModal: true,
          showToast: true,
        });
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
    db.query(updateQuery, ['wireless', email], (err) => {
      if (err) {
        console.error('[submitWirelessForm] Error updating user:', err);
        return res.status(500).render("login/first-time-selection", {
          errorMessage: "Database error updating user.",
          showErrorModal: true,
          showToast: true,
        });
      }
      db.query('SELECT username FROM users WHERE Email = ?', [email], (err2, results) => {
        if (err2 || results.length === 0) {
          console.error('[submitWirelessForm] Failed to get username for notification:', err2);
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
      return res.status(500).json({
        errorMessage: 'Error inserting into fibre_form',
        showErrorModal: true,
        showToast: true,
      });
    }
    db.query(wirelessQuery, [user_id, email], (err) => {
      if (err) {
        console.error('Error inserting into wireless_form:', err);
        return res.status(500).json({
          errorMessage: 'Error inserting into wireless_form',
          showErrorModal: true,
          showToast: true,
        });
      }
      db.query(updateLoginQuery, [email], (err) => {
        if (err) {
          console.error('Error updating first_time_login:', err);
          return res.status(500).json({
            errorMessage: 'Error updating user login status',
            showErrorModal: true,
            showToast: true,
          });
        }
        res.status(200).json({
          message: 'Forms skipped successfully',
          showToast: true,
        });
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
      errorMessage: null,
      showToast: true,
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
        showErrorModal: true,
        showToast: true,
      });
    }

    const backgroundSql = "SELECT * FROM nav_table";
    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).render("login/login", {
          errorMessage: "Internal Server Error. Please try again.",
          showForgotModal: true,
          showErrorModal: true,
          showToast: true,
        });
      }

      if (results.length === 0) {
        return res.render("login/login", {
          bg_result,
          errorMessage: "Email not found. Please enter a valid email.",
          showForgotModal: true,
          showErrorModal: true,
          showToast: true,
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
            showErrorModal: true,
            showToast: true,
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
              showErrorModal: true,
              showToast: true,
            });
          }

          res.render("login/verify_otp", {
            email,
            message: "OTP Code Sent To Your Email.",
            errorMessage: null,
            showErrorModal: false,
            showToast: true,
          });
        });
      });
    });
  });
};

exports.verifyOtpAndResetPassword = (req, res) => {
  const { email, otp, newPassword } = req.body;

  const currentTime = Date.now();

  const checkOtpSql = "SELECT * FROM users WHERE email = ? AND otp = ? AND otp_expiry >= ?";
  db.query(checkOtpSql, [email, otp, currentTime], (err, results) => {
    if (err) {
      console.error("Database error during OTP check:", err);
      return res.status(500).render("login/verify_otp", {
        email,
        errorMessage: "Database error during OTP check.",
        showErrorModal: true,
        showToast: true,
      });
    }

    if (results.length === 0) {
      return res.render("login/verify_otp", {
        email,
        message: "Invalid or expired OTP. Please try again.",
        errorMessage: "Invalid or expired OTP. Please try again.",
        showErrorModal: true,
        showToast: true,
      });
    }

    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.status(500).render("login/verify_otp", {
          email,
          errorMessage: "Error hashing password.",
          showErrorModal: true,
          showToast: true,
        });
      }

      const data = "SELECT * FROM nav_table";
      db.query(data, (err, bg_result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).render("login/login", {
            errorMessage: "Internal Server Error. Please try again.",
            showErrorModal: true,
            showToast: true,
          });
        }

        const updatePasswordSql = "UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?";
        db.query(updatePasswordSql, [hashedPassword, email], (err) => {
          if (err) {
            console.error("Error updating password:", err);
            return res.status(500).render("login/verify_otp", {
              email,
              errorMessage: "Error updating password.",
              showErrorModal: true,
              showToast: true,
            });
          }
          res.render("login/login", {
            bg_result,
            message: "Password reset successfully. Please sign in.",
            errorMessage: null,
            showErrorModal: false,
            showToast: true,
          });
        });
      });
    });
  });
};

// forget password // forget password