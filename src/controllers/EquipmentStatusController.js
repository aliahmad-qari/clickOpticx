const db = require("../config/db");
const moment = require("moment");

exports.status = (req, res) => {
  const sql = `
    SELECT Username, Email, Number, plan, id, password, role  
    FROM users 
    WHERE role = 'Team'
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    const backgroundSql = "SELECT * FROM nav_table";
    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      };

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

          const activeQuery = `
                        SELECT device_label AS equipment_name
                        FROM fibre_form_submissions
                        WHERE device_label IS NOT NULL AND device_label != ''
                        UNION
                        SELECT wifi_onu AS equipment_name 
                        FROM wireless_forms
                        WHERE wifi_onu IS NOT NULL AND wifi_onu != ''
                        UNION
                        SELECT signal_receiver AS equipment_name
                        FROM wireless_forms
                        WHERE signal_receiver IS NOT NULL AND signal_receiver != ''
                        UNION
                        SELECT tower_ap_device AS equipment_name
                        FROM wireless_forms
                        WHERE tower_ap_device IS NOT NULL AND tower_ap_device != ''
                    `;
          db.query(activeQuery, (err, activeEquipment) => {
            if (err) {
              console.error("Database query error:", err);
              return res.status(500).send("Internal Server Error");
            }

            const inactiveQuery = `
              SELECT name, quantity
              FROM equipment_stock
              WHERE name IN (
                'X-pon', 'E-pon', 'G-pon',
                'Light Beam-M5', 'Light Beam-AC', 'Power Beam-M5', 'Power Beam-AC',
                'Nano-station', 'Outdoor Router', 'WiFi ONU China', 'WiFi ONU Net gear',
                'phone', 'jjj'
              )
            `;
            db.query(inactiveQuery, (err, inactiveEquipment) => {
              if (err) {
                console.error("Database query error:", err);
                return res.status(500).send("Internal Server Error");
              }

              const faultyEquipmentSql = `
                            SELECT id, teamName, Username, equipment, status, DATE_FORMAT(created_at, '%Y-%m-%d') AS currentDate
                            FROM usercomplaint
                            WHERE teamName IS NOT NULL AND equipment IS NOT NULL
                            `;

              db.query(faultyEquipmentSql, (err, faultyEquipment) => {
                if (err) {
                  console.error("Error fetching faulty equipment:", err);
                  return res.status(500).send("Server Error");
                }
                
                const isAdmin = "admin";
                const isUser = req.session.user && req.session.user.role === "user";
    
                const successMsg = req.flash("success");
                const Notifactions = NotifactionResult[0].totalNotifactions;

                res.render("userEquipment/EquipmentStatus", {
                  user: results,
                  message: null,
                  isAdmin,
                  bg_result,
                  messages: {
                    success: successMsg.length > 0 ? successMsg[0] : null,
                  },
                  totalNotifactions,
                  password_datass,
                  Notifactions,
                  notifications_users: password_datass,
                  isUser,
                  activeEquipment,
                  inactiveEquipment,
                  faultyEquipment,
                });
              });
            });
          });
        });
      });
    });
  });
};

exports.repairEquipment = (req, res) => {
  const id = req.params.id;
  const { equipment } = req.body;

  // Map equipment to type and category
  const equipmentTypes = {
    wifi: { type: "wireless", category: "Wireless Devices" },
    "cat 6 wire": { type: "fibre", category: "Fibre Optics" },
    "x-pon": { type: "fibre", category: "Fibre Optics" },
    "e-pon": { type: "fibre", category: "Fibre Optics" },
    "g-pon": { type: "fibre", category: "Fibre Optics" },
    "light beam-m5": { type: "wireless", category: "Wireless Devices" },
    "light beam-ac": { type: "wireless", category: "Wireless Devices" },
    "power beam-m5": { type: "wireless", category: "Wireless Devices" },
    "power beam-ac": { type: "wireless", category: "Wireless Devices" },
    "nano-station": { type: "wireless", category: "Wireless Devices" },
    "outdoor router": { type: "wireless", category: "Wireless Devices" },
    "wifi onu china": { type: "wireless", category: "Wireless Devices" },
    "wifi onu net gear": { type: "wireless", category: "Wireless Devices" },
    phone: { type: "other", category: "Miscellaneous" },
    jjj: { type: "other", category: "Miscellaneous" },
  };
  const { type, category } = equipmentTypes[equipment.toLowerCase()] || {
    type: "fibre",
    category: "Fibre Optics",
  };

  // Check if equipment exists in stock
  const checkStockSql =
    "SELECT id, quantity FROM equipment_stock WHERE name = ?";
  db.query(checkStockSql, [equipment], (err, results) => {
    if (err) {
      console.error("Error checking stock:", err);
      return res.json({ success: false, message: "Database error" });
    }

    // Begin transaction
    db.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        return res.json({ success: false, message: "Transaction error" });
      }

      // Update stock
      let stockSql;
      if (results.length > 0) {
        // Equipment exists, increment quantity
        stockSql =
          "UPDATE equipment_stock SET quantity = quantity + 1 WHERE name = ?";
        db.query(stockSql, [equipment], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error updating stock:", err);
              res.json({ success: false, message: "Error updating stock" });
            });
          }
          updateStatus();
        });
      } else {
        // Equipment doesn't exist, insert new record
        stockSql =
          "INSERT INTO equipment_stock (name, quantity, type, category) VALUES (?, 1, ?, ?)";
        db.query(stockSql, [equipment, type, category], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error inserting stock:", err);
              res.json({ success: false, message: "Error inserting stock" });
            });
          }
          updateStatus();
        });
      }

      // Update status in usercomplaint
      function updateStatus() {
        const updateSql = "UPDATE usercomplaint SET status = ? WHERE id = ?";
        db.query(updateSql, ["Repaired", id], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error updating status:", err);
              res.json({ success: false, message: "Error updating status" });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error committing transaction:", err);
                res.json({
                  success: false,
                  message: "Transaction commit error",
                });
              });
            }
            res.json({ success: true });
          });
        });
      }
    });
  });
};

exports.markPermanentDamage = (req, res) => {
  const id = req.params.id;
  const { equipment, teamName } = req.body;

  // Begin transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.json({ success: false, message: "Transaction error" });
    }

    // Insert into recovery_equipment
    const insertSql =
      "INSERT INTO recovery_equipment (teamName, equipment, recoveryDate) VALUES (?, ?, CURDATE())";
    db.query(insertSql, [teamName, equipment], (err) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error inserting to recovery:", err);
          res.json({ success: false, message: "Error inserting to recovery" });
        });
      }

      // Update status in usercomplaint
      const updateSql = "UPDATE usercomplaint SET status = ? WHERE id = ?";
      db.query(updateSql, ["Permanent Damage", id], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error updating status:", err);
            res.json({ success: false, message: "Error updating status" });
          });
        }

        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error committing transaction:", err);
              res.json({ success: false, message: "Transaction commit error" });
            });
          }
          res.json({ success: true });
        });
      });
    });
  });
};
