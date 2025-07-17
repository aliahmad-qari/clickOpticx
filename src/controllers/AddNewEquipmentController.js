const db = require("../config/db");

exports.AddEquipments = (req, res) => {
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
          const isAdmin = "admin";
          const isUser = req.session.user && req.session.user.role === "user";
          const successMsg = req.flash("success");
          const Notifactions = NotifactionResult[0].totalNotifactions;
          res.render("userEquipment/AddNewEquipment", {
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
          });
        });
      });
    });
  });
};

exports.AddEquipment = (req, res) => {
  const { type, name, quantity } = req.body;
  const image = req.file ? `uploads/${req.file.filename}` : null;

  // Validate inputs
  if (!type || !name || !quantity) {
    return res.status(400).send("Type, name, and quantity are required");
  }

  // Validate quantity: Ensure it contains at least a number
  const quantityMatch = quantity.match(/^\d+(\s*\w+)?$/); // Matches "44", "44 meter", "44meter", etc.
  if (!quantityMatch) {
    return res
      .status(400)
      .send('Quantity must contain a number (e.g., "44" or "44 meter")');
  }

  const category = type === "fibre" ? "Fibre Optics" : "Wireless Devices";

  const checkQuery = `SELECT id, quantity FROM equipment_stock WHERE type = ? AND name = ? AND category = ?`;
  db.query(checkQuery, [type, name, category], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (results.length > 0) {
      // Equipment exists, update the quantity and image
      const existingQuantity = results[0].quantity;
      const existingNumber = parseInt(existingQuantity.match(/\d+/)[0]);
      const newNumber = parseInt(quantity.match(/\d+/)[0]);
      const unit = quantity.match(/\d+\s*(\w+)/)
        ? quantity.match(/\d+\s*(\w+)/)[1]
        : "";
      const updatedNumber = existingNumber + newNumber;
      const updatedQuantity = unit
        ? `${updatedNumber} ${unit}`
        : `${updatedNumber}`;

      const updateQuery = `UPDATE equipment_stock SET quantity = ?, image = ? WHERE id = ?`;
      db.query(
        updateQuery,
        [updatedQuantity, image, results[0].id],
        (err, result) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Internal Server Error");
          }
          req.flash("success", "Equipment added successfully!");
          res.redirect("/ViewAllEquipments");
        }
      );
    } else {
      // New equipment, insert it
      const insertQuery = `INSERT INTO equipment_stock (type, name, quantity, category, image) VALUES (?, ?, ?, ?, ?)`;
      db.query(
        insertQuery,
        [type, name, quantity, category, image],
        (err, result) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Internal Server Error");
          }
          req.flash("success", "Equipment added successfully!");
          res.redirect("/ViewAllEquipments");
        }
      );
    }
  });
};
