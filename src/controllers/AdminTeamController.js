const db = require("../config/db");
const bcrypt = require("bcrypt");

const moment = require("moment"); // make sure this is included at the top

exports.AllTeams = (req, res) => {
  const userId = req.session.userId;
  const perPage = 10;
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || "";

  let sql = `
    SELECT Username, Email, Number, plan, id, password, role
    FROM users 
    WHERE role = 'Team'
  `;
  let countSql = `
    SELECT COUNT(*) as total 
    FROM users 
    WHERE role = 'Team'
  `;
  const queryParams = [];

  if (search) {
    sql += ` AND Username LIKE ?`;
    countSql += ` AND Username LIKE ?`;
    queryParams.push(`%${search}%`);
  }

  sql += ` LIMIT ? OFFSET ?`;
  queryParams.push(perPage, (page - 1) * perPage);

  db.query(countSql, search ? [`%${search}%`] : [], (err, countResult) => {
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

      const backgroundSql = "SELECT * FROM nav_table";
      db.query(backgroundSql, (err, bg_result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
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
              return res.status(500).send("Server Error");
            }

            const notifications_users = `
              SELECT COUNT(*) AS Notifactions 
              FROM notifications_user 
              WHERE user_id = ?
            `;
            db.query(notifications_users, [userId], (err, Notifaction) => {
              if (err) {
                console.error("Error fetching user notifications count:", err);
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
                    console.error("Error fetching notification details:", err);
                    return res.status(500).send("Server Error");
                  }

                  const successMsg = req.flash("success");
                  const isAdmin = "admin";
                  const isUser =
                    results.length > 0 && results[0].role === "user";
                  const isTeam =
                    results.length > 0 && results[0].role === "Team";

                  res.render("AddTeam/Team", {
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
                    currentPage: page,
                    perPage: perPage,
                    totalUsers: totalUsers,
                    search: search,
                  });
                }
              );
            });
          });
        });
      });
    });
  });
};

// All AdminUsers Update
exports.UpdateTeam = async (req, res) => {
  const userId = req.params.id;
  const { Username, Email, role, Number, password } = req.body;

  try {
    let hashedPassword = null;

    if (password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const sql =
      "UPDATE users SET Username = ?, Email = ?, role = ?, Number = ?" +
      (hashedPassword ? ", password = ?" : "") +
      " WHERE id = ?";

    const values = hashedPassword
      ? [Username, Email, role, Number, hashedPassword, userId]
      : [Username, Email, role, Number, userId];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }
      req.flash("success", "Team updated successfully!");
      res.redirect("/AdminTeam");
    });
  } catch (err) {
    console.error("Error hashing password:", err);
    res.status(500).send("Internal Server Error");
  }
};

// All AdminUsers Delete
exports.DeleteTeam = (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "Team deleted successfully!");
    res.redirect("/AdminTeam");
  });
};
