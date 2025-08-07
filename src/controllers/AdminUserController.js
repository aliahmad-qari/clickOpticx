const db = require("../config/db");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const crypto = require("crypto");

// ✅ Get All Users
exports.AllUsers = (req, res, viewName = "AddUsers/User") => {

  const userId = req.session.userId;
  const perPage = 10;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || "";
  const packageFilter = req.query.package || "";
  const expiryStatus = req.query.expiryStatus || "";
  const invoiceFilter = req.query.invoice || "";

 let sql = `
  SELECT u.Username, u.Email, u.user_img, u.Number, u.plan, u.password, u.role, u.id,
         COALESCE(p.expiry_date, u.expiry) as expiry,
         COALESCE(p.status, u.invoice, 'unpaid') as invoice,
         p.package_name, p.amount, p.created_at as payment_date
  FROM users u 
  LEFT JOIN payments p ON u.id = p.user_id
  WHERE u.role = 'user'
`;

  let countSql = `
    SELECT COUNT(DISTINCT u.id) as total 
    FROM users u
    LEFT JOIN payments p ON u.id = p.user_id
    WHERE u.role = 'user'
  `;

  const queryParams = [];

  // 🗓 Expiry Filters
  if (expiryStatus === "expired") {
    sql += ` AND COALESCE(p.expiry_date, u.expiry) < CURDATE()`;
    countSql += ` AND COALESCE(p.expiry_date, u.expiry) < CURDATE()`;
  } else if (expiryStatus === "near_expiry") {
    sql += ` AND COALESCE(p.expiry_date, u.expiry) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
    countSql += ` AND COALESCE(p.expiry_date, u.expiry) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
  } 
else if (expiryStatus === "active") {
  sql += ` AND COALESCE(p.expiry_date, u.expiry) > CURDATE() AND (COALESCE(p.status, u.invoice, 'unpaid') != 'paid')`;
  countSql += ` AND COALESCE(p.expiry_date, u.expiry) > CURDATE() AND (COALESCE(p.status, u.invoice, 'unpaid') != 'paid')`;
}



  // 🔍 Search
  if (search) {
    sql += ` AND u.Username LIKE ?`;
    countSql += ` AND u.Username LIKE ?`;
    queryParams.push(`%${search}%`);
  }

  // 📦 Package Filter
  if (packageFilter) {
    sql += ` AND u.plan = ?`;
    countSql += ` AND u.plan = ?`;
    queryParams.push(packageFilter);
  }

  // 💰 Invoice Filter - Updated to use payments table
  if (invoiceFilter === "paid") {
    sql += ` AND COALESCE(p.status, u.invoice, 'unpaid') = 'paid'`;
    countSql += ` AND COALESCE(p.status, u.invoice, 'unpaid') = 'paid'`;
  } else if (invoiceFilter === "unpaid") {
    sql += ` AND COALESCE(p.status, u.invoice, 'unpaid') IN ('unpaid', 'pending')`;
    countSql += ` AND COALESCE(p.status, u.invoice, 'unpaid') IN ('unpaid', 'pending')`;
  }

  // 📄 Group by user ID to avoid duplicates and add pagination
  sql += ` GROUP BY u.id ORDER BY u.Username LIMIT ? OFFSET ?`;
  queryParams.push(perPage, (page - 1) * perPage);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // ⛏ Helper Queries
  const backgroundSql = "SELECT * FROM nav_table";
  const notifSql = `SELECT COUNT(*) AS totalNotifactions FROM notifications WHERE is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY`;
  const passwordSql = `SELECT * FROM notifications WHERE is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY ORDER BY id DESC`;
  const paidSql = `
    SELECT Username, Email, user_img, created_at FROM users 
    WHERE role = 'user' AND invoice = 'paid' 
    AND MONTH(created_at) = ? AND YEAR(created_at) = ?
  `;
  const unpaidSql = `
    SELECT Username, Email, user_img, created_at FROM users 
    WHERE role = 'user' AND (invoice IS NULL OR invoice = 'unpaid') 
    AND MONTH(created_at) = ? AND YEAR(created_at) = ?
  `;

  // 🧠 Main Execution
  db.query(countSql, queryParams.slice(0, -2), (err, countResult) => {
    if (err) return res.status(500).send("Internal Server Error");
    const totalUsers = countResult[0].total;

    db.query(sql, queryParams, (err, users) => {
      if (err) return res.status(500).send("Internal Server Error");

      db.query(backgroundSql, (err, bg_result) => {
        if (err) return res.status(500).send("Internal Server Error");

        db.query(notifSql, (err, notifCountResult) => {
          if (err) return res.status(500).send("Internal Server Error");
          const totalNotifactions = notifCountResult[0].totalNotifactions;

          db.query("SELECT * FROM payments", (err, payments) => {
            if (err) return res.status(500).send("Internal Server Error");

            db.query(passwordSql, (err, password_datass) => {
              if (err) return res.status(500).send("Internal Server Error");

              const notifUserCountSql = `
                SELECT COUNT(*) AS Notifactions FROM notifications_user WHERE user_id = ?
              `;
              db.query(notifUserCountSql, [userId], (err, notifCountUserResult) => {
                if (err) return res.status(500).send("Internal Server Error");
                const Notifactions = notifCountUserResult[0].Notifactions;

                const unreadNotifSql = `
                  SELECT * FROM notifications_user 
                  WHERE user_id = ? AND is_read = 0 
                  AND created_at >= NOW() - INTERVAL 2 DAY 
                  ORDER BY id DESC
                `;
                db.query(unreadNotifSql, [userId], (err, notifications_users) => {
                  if (err) return res.status(500).send("Internal Server Error");

                  db.query("SELECT * FROM packages", (err, Package_results) => {
                    if (err) return res.status(500).send("Internal Server Error");

                    db.query(paidSql, [currentMonth, currentYear], (err, paidUsers) => {
                      if (err) return res.status(500).send("Internal Server Error");

                      db.query(unpaidSql, [currentMonth, currentYear], (err, unpaidUsers) => {
                        if (err) return res.status(500).send("Internal Server Error");

                      res.render(viewName, {

                          user: users,
                          message: null,
                          isAdmin: "admin",
                          isTeam: false,
                          bg_result,
                          totalNotifactions,
                          password_datass,
                          messages: {
                            success: req.flash("success")[0] || null,
                          },
                          isUser: req.session.user?.role === "user",
                          notifications_users,
                          Notifactions,
                          Package_results,
                          currentPage: page,
                          perPage,
                          totalUsers,
                          search,
                          package: packageFilter,
                          payments_results: payments,
                          paidCount: paidUsers.length,
                          unpaidCount: unpaidUsers.length,
                          paidUsers,
                          unpaidUsers,
                          expiryStatus,
                          invoice: invoiceFilter
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

// ✅ Update User
exports.UpdateUser = async (req, res) => {
  const userId = req.params.id;
  const {
    Username,
    Email,
    Number,
    role,
    plan,
    invoice,
    password,
    expiry,
    department, // ✅ include this
  } = req.body;

  try {
    let hashedPassword = null;
    if (password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    // Update users table
    const userSql = `
      UPDATE users 
      SET Username = ?, Email = ?, Number = ?, invoice = ?, role = ?, plan = ?, expiry = ?, department = ?
      ${hashedPassword ? `, password = ?` : ``} 
      WHERE id = ?
    `;

    const userValues = hashedPassword
      ? [Username, Email, Number, invoice, role, plan, expiry, department, hashedPassword, userId]
      : [Username, Email, Number, invoice, role, plan, expiry, department, userId];

    db.query(userSql, userValues, (err) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      // Check if payments record exists for this user
      const checkPaymentSql = `SELECT id FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`;
      
      db.query(checkPaymentSql, [userId], (err, paymentResults) => {
        if (err) {
          console.error("Error checking payments:", err);
          req.flash("success", "User updated successfully! (Payment sync may have failed)");
          return res.redirect("/AdminUser");
        }

        if (paymentResults.length > 0) {
          // Update existing payment record
          const updatePaymentSql = `
            UPDATE payments 
            SET status = ?, expiry_date = ? 
            WHERE user_id = ? AND id = ?
          `;
          
          db.query(updatePaymentSql, [invoice, expiry, userId, paymentResults[0].id], (err) => {
            if (err) {
              console.error("Error updating payment:", err);
            }
            req.flash("success", "User and payment status updated successfully!");
            res.redirect("/AdminUser");
          });
        } else {
          // Create new payment record if user doesn't have one
          const insertPaymentSql = `
            INSERT INTO payments (user_id, status, expiry_date, package_name, created_at) 
            VALUES (?, ?, ?, ?, NOW())
          `;
          
          db.query(insertPaymentSql, [userId, invoice, expiry, plan], (err) => {
            if (err) {
              console.error("Error creating payment record:", err);
            }
            req.flash("success", "User updated and payment record created successfully!");
            res.redirect("/AdminUser");
          });
        }
      });
    });
  } catch (err) {
    console.error("Error hashing password:", err);
    res.status(500).send("Internal Server Error");
  }
};

// ✅ Delete User
exports.DeleteUser = (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [userId], (err) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "User deleted successfully!");
    res.redirect("/AdminUser");
  });
};

// ✅ Get Non-Verified Users
exports.NonVerifiedUsers = (req, res) => {
  const perPage = 10;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || "";

  let sql = `
    SELECT id, Username, Email, Number, cnic, created_at, verification_token, user_verified
    FROM users 
    WHERE role = 'user' AND user_verified = 0
  `;

  let countSql = `
    SELECT COUNT(*) as total 
    FROM users 
    WHERE role = 'user' AND user_verified = 0
  `;

  const queryParams = [];

  // Search functionality
  if (search) {
    sql += ` AND (Username LIKE ? OR Email LIKE ?)`;
    countSql += ` AND (Username LIKE ? OR Email LIKE ?)`;
    queryParams.push(`%${search}%`, `%${search}%`);
  }

 const offset = (page - 1) * perPage;
sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
queryParams.push(perPage, offset);

// Get total count for pagination
db.query(countSql, search ? [queryParams[0], queryParams[1]] : [], (err, countResult) => {
  if (err) {
    console.error("Count query error:", err);
    return res.status(500).send("Internal Server Error");
  }

  const totalUsers = countResult[0].total;
  const totalPages = Math.ceil(totalUsers / perPage);

  // Get users
  db.query(sql, queryParams, (err, users) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    // Get notification count for admin
    const notificationSql = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 DAY)
    `;

    db.query(notificationSql, (err, notificationResult) => {
      const notificationCount = err ? 0 : notificationResult[0].count;

      // Get background/navbar data
      const bgSql = "SELECT * FROM nav_table";
      db.query(bgSql, (err, bg_result) => {
        if (err) {
          console.error("Background query error:", err);
          bg_result = [{ logo_text: "ClickOpticx" }];
        }

        // ✅ ADD THIS QUERY
        const passwordSql = `
          SELECT * FROM notifications 
          WHERE is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY 
          ORDER BY id DESC
        `;

        db.query(passwordSql, (err, password_datass) => {
          if (err) {
            console.error("Password notifications query error:", err);
            password_datass = []; // fallback
          }

          res.render("AddUsers/NonVerifiedUsers", {
            users,
            currentPage: page,
            totalPages,
            totalUsers,
            search,
            perPage,
            notificationCount,
            totalNotifactions: notificationCount,
            bg_result,
            
            isAdmin: true,
            isUser: false,
            password_datass,
            
            successMessage: req.flash("success"),
            errorMessage: req.flash("error"),
            user: req.session.user || null 
          });
        }); // 🔚 end passwordSql
      }); // 🔚 end bgSql
    }); // 🔚 end notificationSql
  }); // 🔚 end users query
}); // 🔚 end countSql
}


// ✅ Resend Verification Email
exports.ResendVerificationEmail = (req, res) => {
  const userId = req.params.id;

  // Get user details
  const getUserSql = "SELECT Username, Email, verification_token FROM users WHERE id = ? AND user_verified = 0";
  db.query(getUserSql, [userId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      req.flash("error", "Database error occurred");
      return res.redirect("/NonVerifiedUsers");
    }

    if (results.length === 0) {
      req.flash("error", "User not found or already verified");
      return res.redirect("/NonVerifiedUsers");
    }

    const user = results[0];
    
    // Generate new verification token if needed
    const verificationToken = user.verification_token || crypto.randomBytes(32).toString("hex");
    
    // Update verification token if it was null
    if (!user.verification_token) {
      const updateTokenSql = "UPDATE users SET verification_token = ? WHERE id = ?";
      db.query(updateTokenSql, [verificationToken, userId], (err) => {
        if (err) {
          console.error("Error updating verification token:", err);
        }
      });
    }

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "clickopticx@gmail.com",
        pass: "qjnm esst kuxp kabq",
      },
    });

    const verifyUrl = `https://app.clickopticx.com/verify-email?token=${verificationToken}`;
    const mailOptions = {
      from: "clickopticx@gmail.com",
      to: user.Email,
      subject: "Verify Your Email - Resent",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4B49AC;">Welcome, ${user.Username}!</h2>
          <p>Your verification email has been resent by an administrator.</p>
          <p>Click the button below to verify your account:</p>
          <a href="${verifyUrl}" style="background-color: #4B49AC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
          <p style="margin-top: 20px;">Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${verifyUrl}</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This email was sent from ClickOpticx. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error("Email sending error:", err);
        req.flash("error", "Failed to send verification email");
      } else {
        req.flash("success", `Verification email resent to ${user.Email}`);
      }
      res.redirect("/NonVerifiedUsers");
    });
  });
};

// ✅ Manual Verify User
exports.ManualVerifyUser = (req, res) => {
  const userId = req.params.id;

  const sql = "UPDATE users SET user_verified = 1, verification_token = NULL WHERE id = ? AND user_verified = 0";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      req.flash("error", "Database error occurred");
      return res.redirect("/NonVerifiedUsers");
    }

    if (result.affectedRows === 0) {
      req.flash("error", "User not found or already verified");
    } else {
      req.flash("success", "User verified successfully!");
    }
    
    res.redirect("/NonVerifiedUsers");
  });
};
