const db = require("../config/db");
const moment = require("moment");

exports.profile = (req, res) => {
  const userSql = `
        SELECT Username, Email, Number, plan, id, password, role  
        FROM users 
        WHERE role = 'Team'
    `;

  db.query(userSql, (err, results) => {
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

        const notificationDetailsSql = `
                    SELECT * FROM notifications 
                    WHERE is_read = 0 
                    AND created_at >= NOW() - INTERVAL 2 DAY 
                    ORDER BY id DESC
                `;

        db.query(notificationDetailsSql, (err, password_datass) => {
          if (err) {
            console.error("Error fetching notification details:", err);
            return res.status(500).send("Server Error");
          }

          const recoverySql = `
                        SELECT id, teamName, equipment, DATE_FORMAT(recoveryDate, '%Y-%m-%d') AS recoveryDateFormatted 
                        FROM recovery_equipment 
                        ORDER BY id DESC
                    `;

          db.query(recoverySql, (err, recoveryEquipment) => {
            if (err) {
              console.error("Error fetching recovery equipment:", err);
              return res.status(500).send("Server Error");
            }

            const isAdmin = "admin";
            const isUser = req.session.user && req.session.user.role === "user";

            res.render("userEquipment/RecoveryManagement", {
              user: results,
              message: null,
              isAdmin,
              isUser,
              bg_result,
              messages: {
                success: req.flash("success")[0] || null,
              },
              totalNotifactions: NotifactionResult[0].totalNotifactions,
              Notifactions: NotifactionResult[0].totalNotifactions,
              password_datass,
              notifications_users: password_datass,
              recoveryEquipment,
            });
          });
        });
      });
    });
  });
};

exports.deleteRecovery = (req, res) => {
  const id = req.params.id;

  const deleteSql = "DELETE FROM recovery_equipment WHERE id = ?";

  db.query(deleteSql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting recovery item:", err);
      return res.status(500).send("Server Error");
    }

    req.flash("success", "Recovery item deleted successfully.");
    res.redirect("/RecoveryManagement");
  });
};
