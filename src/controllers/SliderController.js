const db = require("../config/db");
const sql = require("../models/users");

// Select image
exports.Slider_imgs = (req, res) => {
  const userId = req.session.userId;

  const sqlProfile = `
      SELECT *
      FROM users WHERE id = ?`;

  const sqlSlider = "SELECT * FROM slider";

  db.query(sqlProfile, [userId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    db.query(sqlSlider, (err, sliderResults) => {
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

        // ✅ Only unread notifications from the last 2 days
        const passwordSql = `
      SELECT * FROM notifications 
      WHERE is_read = 0 
        AND created_at >= NOW() - INTERVAL 2 DAY 
      ORDER BY id DESC
    `;
        db.query(passwordSql, (err, password_datass) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Internal Server Error");
          }
          // ✅ Only unread notifications from the last 2 days

          // ssssssssss
          const NotifactionSql =
            "SELECT COUNT(*) AS totalNotifactions FROM notifications WHERE is_read = 0 AND created_at >= NOW() - INTERVAL 2 DAY";
          db.query(NotifactionSql, (err, NotifactionResult) => {
            if (err) {
              console.error("Error fetching total notifications:", err);
              return res.status(500).send("Database error");
            }

            const totalNotifactions = NotifactionResult[0].totalNotifactions;
            // ssssssss

            const isAdmin = results.length > 0 && results[0].role === "admin";
            const isUser = results.length > 0 && results[0].role === "user";
            const isteam = results.length > 0 && results[0].role === "Team";

            // 👇 Flash messages here
            const successMsg = req.flash("success");

            res.render("AdminSlider_Img/Slider_img", {
              user: results,
              slider: sliderResults,
              message: null,
              isAdmin,
              isUser,
              bg_result,
              isteam,
              messages: {
                success: successMsg.length > 0 ? successMsg[0] : null,
              },
              password_datass,
              totalNotifactions,
            });
          });
        });
      });
    });
  });
};

// update the Nav_br img // update the Nav_bar img
exports.Slider_img = (req, res) => {
  // Check if files exist
  const Slider_1 = req.files?.Slider_1 ? req.files.Slider_1[0].path : null;

  if (Slider_1) {
    // Log high-quality upload details
    console.log('🖼️ High-Quality Slider Image Uploaded:');
    console.log('📁 File Path:', Slider_1);
    console.log('📊 Original Size:', `${req.files.Slider_1[0].size} bytes`);
    console.log('📐 Cloudinary URL:', Slider_1);
    const SqlInsert = "INSERT INTO slider ( Slider_1) VALUES (?)";

    db.query(SqlInsert, [Slider_1], (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      req.flash("success", "Slider image added successfully!");

      res.redirect("/BrandingPage");
    });
  }
};

// Delete Slider_img
exports.DeleteSlider = (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM slider WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    if (result.affectedRows === 0) {
      return res.status(404).send("Slider not found");
    }
    req.flash("success", "Slider image delected successfully!");

    res.status(200).send("Slider deleted successfully");
  });
};
