const db = require("../../config/db");
const moment = require("moment");

exports.ActiveUser = (req, res) => {
  const userId = req.session.userId;
  const { startDate, endDate } = req.query;

  // Build the SQL query for active users
  let sql = `
    SELECT 
      p.user_id, 
      u.Username, 
      p.invoice_status AS invoice, 
      p.package_status AS plan, 
      u.user_img,
      p.expiry_date AS expiry,
      MAX(p.created_at) AS latest_payment
    FROM payments p
    JOIN users u ON p.user_id = u.id
    WHERE p.invoice_status = 'Paid' 
      AND p.package_status = 'Active'
      AND u.role = 'user'
  `;
  const queryParams = [];

  // Add date range filters if provided
  if (startDate) {
    sql += ` AND p.created_at >= ?`;
    queryParams.push(startDate);
  }
  if (endDate) {
    sql += ` AND p.created_at <= ?`;
    queryParams.push(endDate);
  }

  sql += `
    GROUP BY p.user_id
    ORDER BY latest_payment DESC
  `;

  db.query(sql, queryParams, (err, usersResult) => {
    if (err) {
      console.error("User + Payment Query Error:", err);
      return res.status(500).send("Internal Server Error");
    }

    const users = usersResult.map((user) => ({
      id: user.user_id,
      Username: user.Username,
      invoice: user.invoice,
      user_img: user.user_img,
      plan: user.plan,
      expiry: user.expiry ? moment(user.expiry).format("DD-MM-YYYY") : null,
      latest_payment: user.latest_payment
        ? moment(user.latest_payment).format("DD-MM-YYYY")
        : null,
    }));

    // Fetch additional page data
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
      ORDER BY ID DESC
    `;

    db.query(backgroundSql, (err, bg_result) => {
      if (err) return res.status(500).send("Background data error");

      db.query(NotifactionSql, (err, notifCountResult) => {
        if (err) return res.status(500).send("Notification count error");

        const totalNotifactions = notifCountResult[0].totalNotifactions;

        db.query(passwordSql, (err, password_datass) => {
          if (err) return res.status(500).send("Notifications fetch error");

          const userNotifCountSql = `
            SELECT COUNT(*) AS Notifactions 
            FROM notifications_user 
            WHERE user_id = ?
          `;
          db.query(userNotifCountSql, [userId], (err, notifUserCountResult) => {
            if (err)
              return res.status(500).send("User notification count error");

            const Notifactions = notifUserCountResult[0].Notifactions;

            const unreadUserNotifsSql = `
              SELECT * FROM notifications_user 
              WHERE user_id = ? 
                AND is_read = 0 
                AND created_at >= NOW() - INTERVAL 2 DAY 
              ORDER BY id DESC
            `;
            db.query(
              unreadUserNotifsSql,
              [userId],
              (err, notifications_users) => {
                if (err)
                  return res.status(500).send("Unread notifications error");

                const successMsg = req.flash("success");

                const isAdmin = "admin";
                const isUser =
                  req.session.user && req.session.user.role === "user";

                // Render the active users page
                res.render("AddUsers/ActiveUser", {
                  user: users,
                  message: null,
                  isAdmin,
                  bg_result,
                  totalNotifactions,
                  password_datass,
                  messages: {
                    success: successMsg.length > 0 ? successMsg[0] : null,
                  },
                  isUser,
                  notifications_users,
                  Notifactions,
                  startDate,
                  endDate,
                });
              }
            );
          });
        });
      });
    });
  });
};