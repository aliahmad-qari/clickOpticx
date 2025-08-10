const db = require("../../config/db");
const sql = require("../../models/users");
const fs = require("fs");
const path = require("path");

exports.DeletePromotion = (req, res) => {
  const id = req.params.id;

  // Step 1: Get filename from DB
  const getSql = "SELECT img1 FROM promotions WHERE id = ?";
  db.query(getSql, [id], (err, result) => {
    if (err || result.length === 0) {
      console.error("Image fetch error:", err);
      req.flash("error", "Image not found!");
      return res.redirect("/Promotions");
    }

    const fileName = result[0].img1;
    const filePath = path.join(__dirname, "../../public/uploads", fileName);

    // Step 2: Try deleting the file
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        console.warn("File deletion warning:", unlinkErr.message); // non-fatal
      }

      // Step 3: Delete record from DB
      const deleteSql = "DELETE FROM promotions WHERE id = ?";
      db.query(deleteSql, [id], (err2) => {
        if (err2) {
          console.error("Delete query error:", err2);
          req.flash("error", "Failed to delete promotion from database.");
          return res.redirect("/Promotions");
        }

        req.flash("success", "Promotion deleted successfully!");
        res.redirect("/Promotions");
      });
    });
  });
};
exports.Promotions = (req, res) => {
  const userId = req.session.userId;

  // 1. Delete expired promotions first (no cron needed)
  const today = new Date().toISOString().split("T")[0];
  const getExpired = "SELECT id, img1 FROM promotions WHERE valid_till < ?";
  db.query(getExpired, [today], (err, expiredResults) => {
    if (err) {
      console.error("Error checking expired promotions:", err);
    } else {
      expiredResults.forEach(({ id, img1 }) => {
        const filePath = path.join(__dirname, "../../public/uploads", img1);

        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.warn(`Could not delete file ${img1}:`, unlinkErr.message);
          }
        });

        db.query("DELETE FROM promotions WHERE id = ?", [id], (delErr) => {
          if (delErr) {
            console.error(`Failed to delete expired promotion ID ${id}:`, delErr);
          }
        });
      });
    }

    // 2. After deletion, continue with the rest of the page loading logic
    const sql = `
      SELECT Username, Email, Number, plan, password, role, expiry, id 
      FROM users WHERE role = 'user'
    `;
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
              WHERE user_id = ?
            `;

            db.query(notifications_users, [userId], (err, Notifaction) => {
              if (err) return res.status(500).send("Database error");

              const Notifactions = Notifaction[0].Notifactions;

              const passwordSql = `
                SELECT * FROM notifications_user 
                WHERE user_id = ? 
                AND is_read = 0 
                AND created_at >= NOW() - INTERVAL 2 DAY 
                ORDER BY id DESC;
              `;

              db.query(passwordSql, [userId], (err, notifications_users) => {
                if (err) return res.status(500).send("Server Error");

                const promotion =
                  "SELECT * FROM promotions ORDER BY id DESC";
                db.query(promotion, (err, promotionresult) => {
                  if (err) return res.status(500).send("Internal Server Error");

                  const successMsg = req.flash("success");
                  const isAdmin = "admin";
                  const isUser = req.session.user && req.session.user.role === "user";

                  res.render("Notification/Promotions", {
                    user: results,
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
                    promotionresult,
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


exports.InsertPromotions = async (req, res) => {
  try {
    const { link, valid_till } = req.body;

    if (!req.file) {
      req.flash("error", "No file uploaded!");
      return res.redirect("/Promotions");
    }

    const promot = req.file.path;
    const sql = `
      INSERT INTO promotions (img1, link, valid_till, created_at) 
      VALUES (?, ?, ?, NOW())
    `;

    db.query(sql, [promot, link, valid_till], (err, result) => {
      if (err) {
        console.error(err);
        req.flash("error", "An error occurred while inserting the promotion!");
        return res.redirect("/Promotions");
      }

      req.flash("success", "Promotion added successfully!");
      res.redirect("/Promotions");
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Unexpected error occurred!");
    res.redirect("/Promotions");
  }
};

