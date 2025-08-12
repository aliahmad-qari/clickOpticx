const db = require("../../config/db");

// ===== COMMON DATA FETCH FUNCTION =====
function fetchCommonData(userId, callback) {
  const sqlUser = "SELECT * FROM users WHERE id = ?";
  const backgroundSql = "SELECT * FROM nav_table";
  const notifCountSql = `
    SELECT COUNT(*) AS totalNotifactions 
    FROM notifications 
    WHERE is_read = 0 
      AND created_at >= NOW() - INTERVAL 2 DAY`;
  const notifSql = `
    SELECT * FROM notifications 
    WHERE is_read = 0 
      AND created_at >= NOW() - INTERVAL 2 DAY 
    ORDER BY id DESC`;
  const iconSliderSql = "SELECT * FROM icon_slider";

  db.query(sqlUser, [userId], (err, userResult) => {
    if (err) return callback(err);
    const user = userResult.length > 0 ? userResult[0] : null;

    db.query(backgroundSql, (err, bg_result) => {
      if (err) return callback(err);

      db.query(notifCountSql, (err, notifCountRes) => {
        if (err) return callback(err);
        const totalNotifactions = notifCountRes[0].totalNotifactions;

        db.query(notifSql, (err, password_datass) => {
          if (err) return callback(err);

          const notifUserCountSql = `
            SELECT COUNT(*) AS Notifactions 
            FROM notifications_user 
            WHERE user_id = ?`;
          db.query(notifUserCountSql, [userId], (err, notifCount) => {
            if (err) return callback(err);
            const Notifactions = notifCount[0].Notifactions;

            const notifUserSql = `
              SELECT * FROM notifications_user 
              WHERE user_id = ? 
              AND is_read = 0 
              AND created_at >= NOW() - INTERVAL 2 DAY 
              ORDER BY id DESC`;
            db.query(notifUserSql, [userId], (err, notifications_users) => {
              if (err) return callback(err);

              db.query(iconSliderSql, (err, IconSliders) => {
                if (err) return callback(err);

                callback(null, {
                  user,
                  bg_result,
                  totalNotifactions,
                  password_datass,
                  notifications_users,
                  Notifactions,
                  IconSliders
                });
              });
            });
          });
        });
      });
    });
  });
}

// ===== CONTROLLERS =====


// Show both sections
exports.HeaderFooter = (req, res) => {
  const userId = req.session.userId;

  fetchCommonData(userId, (err, data) => {
    if (err) return res.status(500).send("Internal Server Error");
    
    const successMsg = req.flash("success");
    const activeTab = req.query.tab || "both"; // now dynamic (navbar/footer/both)
    console.log("Active Tab:", activeTab);

    res.render("Customization/Edit_HeaderorFooter", {
      ...data,
      message: null,
      isAdmin: "admin",
      isUser: req.session.user && req.session.user.role === "user",
      navImg: data.bg_result[0]?.nav_imgs || null,
      messages: { success: successMsg.length > 0 ? successMsg[0] : null },
      activeTab
    });
  });
};





// Show only Navbar
exports.NavbarSetting = (req, res) => {
  const userId = req.session.userId;
  fetchCommonData(userId, (err, data) => {
    if (err) return res.status(500).send("Internal Server Error");
    res.render("Customization/Edit_HeaderorFooter", {
      ...data,
      isAdmin: "admin",
      isUser: req.session.user && req.session.user.role === "user",
      navImg: data.bg_result[0]?.nav_imgs || null,
      activeTab: "navbar"
    });
  });
};

// Show only Footer
exports.FooterSetting = (req, res) => {
  const userId = req.session.userId;
  fetchCommonData(userId, (err, data) => {
    if (err) return res.status(500).send("Internal Server Error");
    res.render("Customization/Edit_HeaderorFooter", {
      ...data,
      isAdmin: "admin",
      isUser: req.session.user && req.session.user.role === "user",
      navImg: data.bg_result[0]?.nav_imgs || null,
      activeTab: "footer"
    });
  });
};

// Delete footer icon
exports.DeleteIcon = (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM icon_slider WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send("Internal Server Error");
    if (result.affectedRows === 0) {
      return res.status(404).send("Slider not found");
    }
    req.flash("success", "Icon image deleted successfully!");
    res.status(200).send("Icon image deleted successfully");
  });
};
