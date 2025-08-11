const db = require("../../config/db");

// Main User Dashboard (shows everything)
exports.Coustomizations = (req, res) => {
  const userId = req.session.userId;

  const sql = `SELECT * FROM users`;
  const backgroundSql = "SELECT * FROM nav_table";
  const NotifactionSql = `
      SELECT COUNT(*) AS totalNotifactions 
      FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY`;
  const passwordSql = `
      SELECT * FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY 
      ORDER BY id DESC`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).send("Internal Server Error");

    db.query(backgroundSql, (err, bg_result) => {
      if (err) return res.status(500).send("Internal Server Error");

      db.query(NotifactionSql, (err, NotifactionResult) => {
        if (err) return res.status(500).send("Database error");

        const totalNotifactions = NotifactionResult[0].totalNotifactions;

        db.query(passwordSql, (err, password_datass) => {
          if (err) return res.status(500).send("Internal Server Error");

          const notifications_users = `
                        SELECT COUNT(*) AS Notifactions 
                        FROM notifications_user 
                        WHERE user_id = ?`;
          db.query(notifications_users, [userId], (err, Notifaction) => {
            if (err) return res.status(500).send("Database error");

            const Notifactions = Notifaction[0].Notifactions;

            const passwordSql = `
                    SELECT * FROM notifications_user 
                    WHERE user_id = ? 
                    AND is_read = 0 
                    AND created_at >= NOW() - INTERVAL 2 DAY 
                    ORDER BY id DESC`;

                    const sliderSql = "SELECT * FROM slider ORDER BY id DESC";


            db.query(passwordSql, [userId], (err, notifications_users) => {
              if (err) return res.status(500).send("Server Error");
              db.query(sliderSql, (err, slider_result) => {
            if (err) return res.status(500).send("Internal Server Error");

              const successMsg = req.flash("success");
              const isAdmin = "admin";
              const isUser = req.session.user && req.session.user.role === "user";

              res.render("Customization/CustomizationUserPage", {
                user: results,
                slider: slider_result,

                message: null,
                isAdmin,
                isUser,
                bg_result,
                totalNotifactions,
                password_datass,
                messages: {
                  success: successMsg.length > 0 ? successMsg[0] : null,
                },
                notifications_users,
                Notifactions,
                activeTab: null // full page view
              });
            });
          });
        });
      });
    });
  });
  });
}

// Color Settings Page (only color settings div)
exports.ColorSetting = (req, res) => {
  const userId = req.session.userId;

  const sql = `SELECT * FROM users`;
  const backgroundSql = "SELECT * FROM nav_table";
  const NotifactionSql = `
      SELECT COUNT(*) AS totalNotifactions 
      FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY`;
  const passwordSql = `
      SELECT * FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY 
      ORDER BY id DESC`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).send("Internal Server Error");

    db.query(backgroundSql, (err, bg_result) => {
      if (err) return res.status(500).send("Internal Server Error");

      db.query(NotifactionSql, (err, NotifactionResult) => {
        if (err) return res.status(500).send("Database error");

        const totalNotifactions = NotifactionResult[0].totalNotifactions;

        db.query(passwordSql, (err, password_datass) => {
          if (err) return res.status(500).send("Internal Server Error");

          const notifications_users = `
                        SELECT COUNT(*) AS Notifactions 
                        FROM notifications_user 
                        WHERE user_id = ?`;
          db.query(notifications_users, [userId], (err, Notifaction) => {
            if (err) return res.status(500).send("Database error");

            const Notifactions = Notifaction[0].Notifactions;

            const passwordSql = `
                    SELECT * FROM notifications_user 
                    WHERE user_id = ? 
                    AND is_read = 0 
                    AND created_at >= NOW() - INTERVAL 2 DAY 
                    ORDER BY id DESC`;
            db.query(passwordSql, [userId], (err, notifications_users) => {
              if (err) return res.status(500).send("Server Error");

              const isAdmin = "admin";
              const isUser = req.session.user && req.session.user.role === "user";

              res.render("Customization/CustomizationUserPage", {
                user: results,
                isAdmin,
                isUser,
                bg_result,
                totalNotifactions,
                password_datass,
                notifications_users,
                Notifactions,
                activeTab: "color" // show only color tab
              });
            });
          });
        });
      });
    });
  });
};

// Background Settings Page (only background div)
exports.BackGroundSettings = (req, res) => {
  const userId = req.session.userId;

  const sql = `SELECT * FROM users`;
  const backgroundSql = "SELECT * FROM nav_table";
  const NotifactionSql = `
      SELECT COUNT(*) AS totalNotifactions 
      FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY`;
  const passwordSql = `
      SELECT * FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY 
      ORDER BY id DESC`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).send("Internal Server Error");

    db.query(backgroundSql, (err, bg_result) => {
      if (err) return res.status(500).send("Internal Server Error");

      db.query(NotifactionSql, (err, NotifactionResult) => {
        if (err) return res.status(500).send("Database error");

        const totalNotifactions = NotifactionResult[0].totalNotifactions;

        db.query(passwordSql, (err, password_datass) => {
          if (err) return res.status(500).send("Internal Server Error");

          const notifications_users = `
                        SELECT COUNT(*) AS Notifactions 
                        FROM notifications_user 
                        WHERE user_id = ?`;
          db.query(notifications_users, [userId], (err, Notifaction) => {
            if (err) return res.status(500).send("Database error");

            const Notifactions = Notifaction[0].Notifactions;

            const passwordSql = `
                    SELECT * FROM notifications_user 
                    WHERE user_id = ? 
                    AND is_read = 0 
                    AND created_at >= NOW() - INTERVAL 2 DAY 
                    ORDER BY id DESC`;
            db.query(passwordSql, [userId], (err, notifications_users) => {
              if (err) return res.status(500).send("Server Error");

              const isAdmin = "admin";
              const isUser = req.session.user && req.session.user.role === "user";

              res.render("Customization/CustomizationUserPage", {
                user: results,
                isAdmin,
                isUser,
                bg_result,
                totalNotifactions,
                password_datass,
                notifications_users,
                Notifactions,
                activeTab: "background" // show only background tab
              });
            });
          });
        });
      });
    });
  });
};
