const db = require("../config/db");

const moment = require("moment");

exports.getViewAllEquipments = (req, res) => {
  const search = req.query.search || "";
  const category = req.query.category || "";
  const stockStatus = req.query.stockStatus || "";
  let page = parseInt(req.query.page) || 1;
  const entriesPerPage = 7;
  const offset = (page - 1) * entriesPerPage;

  let query = `SELECT * FROM equipment_stock WHERE 1=1`;
  let queryParams = [];

  if (search) {
    query += ` AND name LIKE ?`;
    queryParams.push(`%${search}%`);
  }

  if (category && category !== "All Categories") {
    query += ` AND category = ?`;
    queryParams.push(category);
  }

  if (stockStatus && stockStatus !== "All Stock") {
    if (stockStatus === "In Stock") {
      query += ` AND CAST(quantity AS UNSIGNED) > 10`;
    } else if (stockStatus === "Low Stock") {
      query += ` AND CAST(quantity AS UNSIGNED) > 0 AND CAST(quantity AS UNSIGNED) <= 10`;
    } else if (stockStatus === "Out of Stock") {
      query += ` AND CAST(quantity AS UNSIGNED) = 0`;
    }
  }

  let countQuery = `SELECT COUNT(*) as total FROM equipment_stock WHERE 1=1`;
  let countParams = [];

  if (search) {
    countQuery += ` AND name LIKE ?`;
    countParams.push(`%${search}%`);
  }

  if (category && category !== "All Categories") {
    countQuery += ` AND category = ?`;
    countParams.push(category);
  }

  if (stockStatus && stockStatus !== "All Stock") {
    if (stockStatus === "In Stock") {
      countQuery += ` AND CAST(quantity AS UNSIGNED) > 10`;
    } else if (stockStatus === "Low Stock") {
      countQuery += ` AND CAST(quantity AS UNSIGNED) > 0 AND CAST(quantity AS UNSIGNED) <= 10`;
    } else if (stockStatus === "Out of Stock") {
      countQuery += ` AND CAST(quantity AS UNSIGNED) = 0`;
    }
  }

  query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  queryParams.push(entriesPerPage, offset);

  db.query(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error("Database query error (count):", err);
      return res.status(500).send("Internal Server Error");
    }

    const totalEntries = countResult[0].total;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    const backgroundSql = "SELECT * FROM nav_table";
    db.query(backgroundSql, (err, bg_result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      const isAdmin = "admin";
      const isUser = req.session.user && req.session.user.role === "user";

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

          db.query(query, queryParams, (err, results) => {
            if (err) {
              console.error("Database query error:", err);
              return res.status(500).send("Internal Server Error");
            }

            const successMsg = req.flash("success");
            const Notifactions = NotifactionResult[0].totalNotifactions;

            res.render("userEquipment/ViewAllEquipments", {
              equipment: results,
              user: results,
              search,
              flash: req.flash(),
              error: null,
              bg_result,
              isAdmin,
              isUser,
              page,
              totalEntries,
              totalPages,
              entriesPerPage,
              totalNotifactions,
              Notifactions,
              password_datass,
              notifications_users: password_datass,
              category: category,
              stockStatus: stockStatus,
            });
          });
        });
      });
    });
  });
};

exports.deleteEquipment = (req, res) => {
  const equipmentId = req.params.id;

  const sql = `DELETE FROM equipment_stock WHERE id = ?`;

  db.query(sql, [equipmentId], (err, result) => {
    if (err) {
      console.error("Error deleting equipment:", err);
      return res.status(500).send("Internal Server Error");
    }

    req.flash("success", "Equipment deleted successfully!");
    res.redirect("/ViewAllEquipments");
  });
};

exports.updateEquipment = (req, res) => {
  const { id, type, name, category, quantity } = req.body;
  const image = req.file ? `uploads/${req.file.filename}` : null;

  let sql, params;
  if (image) {
    sql = `UPDATE equipment_stock SET type = ?, name = ?, category = ?, quantity = ?, image = ? WHERE id = ?`;
    params = [type, name, category, quantity, image, id];
  } else {
    sql = `UPDATE equipment_stock SET type = ?, name = ?, category = ?, quantity = ? WHERE id = ?`;
    params = [type, name, category, quantity, id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error updating equipment:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "Equipment updated successfully!");
    res.redirect("/ViewAllEquipments");
  });
};
