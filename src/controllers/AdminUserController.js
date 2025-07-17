const db = require("../config/db");
const bcrypt = require("bcrypt");

// Select all AdminUsers
exports.AllUsers = (req, res) => {
  const userId = req.session.userId;
  const perPage = 10;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || "";
  const package = req.query.package || "";

  // Base SQL query
  let sql = `
      SELECT Username, Email,user_img, Number, plan, password, role, expiry, id 
      FROM users 
      WHERE role = 'user'
  `;
  let countSql = `
      SELECT COUNT(*) as total 
      FROM users 
      WHERE role = 'user'
  `;
  const queryParams = [];

  // Add search condition
  if (search) {
    sql += ` AND Username LIKE ?`;
    countSql += ` AND Username LIKE ?`;
    queryParams.push(`%${search}%`);
  }

  // Add package filter
  if (package) {
    sql += ` AND plan = ?`;
    countSql += ` AND plan = ?`;
    queryParams.push(package);
  }

  // Add pagination
  sql += ` LIMIT ? OFFSET ?`;
  queryParams.push(perPage, (page - 1) * perPage);

  const backgroundSql = "SELECT * FROM nav_table";
  const NotifactionSql = `
      SELECT COUNT(*) AS totalNotifactions 
      FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY
  `;
  const passwordSql = `
      SELECT * FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY 
      ORDER BY id DESC
  `;

  // Get total count for pagination
  db.query(countSql, queryParams.slice(0, -2), (err, countResult) => {
    if (err) {
      console.error("Database query error (count):", err);
      return res.status(500).send("Internal Server Error");
    }

    const totalUsers = countResult[0].total;

    db.query(sql, queryParams, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      db.query(backgroundSql, (err, bg_result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }

        db.query(NotifactionSql, (err, NotifactionResult) => {
          if (err) {
            console.error("Error fetching total notifications:", err);
            return res.status(500).send("Database error");
          }

          const payments = `SELECT * FROM payments`;

          db.query(payments, (err, payments_results) => {
            if (err) {
              console.error("Database query error:", err);
              return res.status(500).send("Internal Server Error");
            }

            const totalNotifactions = NotifactionResult[0].totalNotifactions;

            db.query(passwordSql, (err, password_datass) => {
              if (err) {
                console.error("Database query error (Notifications):", err);
                return res.status(500).send("Internal Server Error");
              }

              const notifications_users = `
                          SELECT COUNT(*) AS Notifactions 
                          FROM notifications_user 
                          WHERE user_id = ?
                      `;

              db.query(notifications_users, [userId], (err, Notifaction) => {
                if (err) {
                  console.error(
                    "Error fetching user notifications count:",
                    err
                  );
                  return res.status(500).send("Database error");
                }

                const Notifactions = Notifaction[0].Notifactions;

                const userNotificationsSql = `
                              SELECT * FROM notifications_user 
                              WHERE user_id = ? 
                              AND is_read = 0 
                              AND created_at >= NOW() - INTERVAL 2 DAY 
                              ORDER BY id DESC
                          `;
                db.query(
                  userNotificationsSql,
                  [userId],
                  (err, notifications_users) => {
                    if (err) {
                      console.error(
                        "Error fetching notification details:",
                        err
                      );
                      return res.status(500).send("Server Error");
                    }

                    const Package = `SELECT * FROM packages`;
                    db.query(Package, (err, Package_results) => {
                      if (err) {
                        console.error("Database query error:", err);
                        return res.status(500).send("Internal Server Error");
                      }

                      const successMsg = req.flash("success");
                      const isAdmin = "admin";
                      const isUser =
                        req.session.user && req.session.user.role === "user";
                      const isTeam =
                        req.session.user && req.session.user.role === "Team";

                      res.render("AddUsers/User", {
                        user: results,
                        message: null,
                        isAdmin,
                        isTeam,
                        bg_result,
                        totalNotifactions,
                        password_datass,
                        messages: {
                          success: successMsg.length > 0 ? successMsg[0] : null,
                        },
                        isUser,
                        notifications_users,
                        Notifactions,
                        Package_results,
                        currentPage: page,
                        perPage: perPage,
                        totalUsers: totalUsers,
                        search: search,
                        package: package,
                        payments_results,
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
};

// All AdminUsers Update
exports.UpdateUser = async (req, res) => {
  const userId = req.params.id;
  const { Username, Email, Number, role, plan, invoice, password, expiry } =
    req.body;

  try {
    let hashedPassword = null;

    if (password) {
      // Hash the new password before storing it
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const sql =
      "UPDATE users SET Username = ?, Email = ?, Number = ?, invoice = ?, role = ?, plan = ?, expiry = ?" +
      (hashedPassword ? ", password = ?" : "") +
      " WHERE id = ?";

    const values = hashedPassword
      ? [
          Username,
          Email,
          Number,
          invoice,
          role,
          plan,
          expiry,
          hashedPassword,
          userId,
        ]
      : [Username, Email, Number, invoice, role, plan, expiry, userId];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }
      req.flash("success", "User updated successfully!");
      res.redirect("/AdminUser");
    });
  } catch (err) {
    console.error("Error hashing password:", err);
    res.status(500).send("Internal Server Error");
  }
};

// All AdminUsers Delete
exports.DeleteUser = (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "User deleted successfully!");
    res.redirect("/AdminUser");
  });
};
