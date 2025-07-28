const db = require("../config/db");
const bcrypt = require("bcrypt");

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
  SELECT Username, Email, user_img, Number, plan, password, role, expiry, id, invoice
  FROM users 
  WHERE role = 'user'
`;


  let countSql = `
    SELECT COUNT(*) as total 
    FROM users 
    WHERE role = 'user'
  `;

  const queryParams = [];

  // 🗓 Expiry Filters
  if (expiryStatus === "expired") {
    sql += ` AND expiry < CURDATE()`;
    countSql += ` AND expiry < CURDATE()`;
  } else if (expiryStatus === "near_expiry") {
    sql += ` AND expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
    countSql += ` AND expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
  } 
else if (expiryStatus === "active") {
  sql += ` AND expiry > CURDATE() AND (invoice IS NULL OR LOWER(invoice) != 'paid')`;
  countSql += ` AND expiry > CURDATE() AND (invoice IS NULL OR LOWER(invoice) != 'paid')`;
}



  // 🔍 Search
  if (search) {
    sql += ` AND Username LIKE ?`;
    countSql += ` AND Username LIKE ?`;
    queryParams.push(`%${search}%`);
  }

  // 📦 Package Filter
  if (packageFilter) {
    sql += ` AND plan = ?`;
    countSql += ` AND plan = ?`;
    queryParams.push(packageFilter);
  }

  // 💰 Invoice Filter
  if (invoiceFilter === "paid") {
    sql += ` AND invoice = 'paid'`;
    countSql += ` AND invoice = 'paid'`;
  } else if (invoiceFilter === "unpaid") {
    sql += ` AND (invoice IS NULL OR invoice = 'unpaid' OR invoice = 'Unpaid')`;
    countSql += ` AND (invoice IS NULL OR invoice = 'unpaid' OR invoice = 'Unpaid')`;
  }

  // 📄 Pagination
  sql += ` LIMIT ? OFFSET ?`;
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

    const sql = `
      UPDATE users 
      SET Username = ?, Email = ?, Number = ?, invoice = ?, role = ?, plan = ?, expiry = ?, department = ?
      ${hashedPassword ? `, password = ?` : ``} 
      WHERE id = ?
    `;

    const values = hashedPassword
      ? [Username, Email, Number, invoice, role, plan, expiry, department, hashedPassword, userId]
      : [Username, Email, Number, invoice, role, plan, expiry, department, userId];

    db.query(sql, values, (err) => {
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
