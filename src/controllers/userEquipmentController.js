const db = require("../config/db");

// Select image
exports.Slider_imgs = (req, res) => {
  const userId = req.session.userId;
  
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || "";
  const entriesPerPage = 7;
  const offset = (page - 1) * entriesPerPage;

  const sqlProfile = `
      SELECT Username, Email, plan, invoice, user_img, role 
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

      // Fibre form submissions with pagination
      let fibreSql = "SELECT * FROM fibre_form_submissions";
      let fibreParams = [];
      
      if (search) {
        fibreSql += " WHERE email LIKE ? OR user_id LIKE ?";
        fibreParams = [`%${search}%`, `%${search}%`];
      }
      
      const fibreCountSql = search ? 
        "SELECT COUNT(*) as total FROM fibre_form_submissions WHERE email LIKE ? OR user_id LIKE ?" :
        "SELECT COUNT(*) as total FROM fibre_form_submissions";
      
      fibreSql += " ORDER BY id DESC LIMIT ? OFFSET ?";
      fibreParams.push(entriesPerPage, offset);

      db.query(fibreCountSql, search ? [`%${search}%`, `%${search}%`] : [], (err, fibreCountResult) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Internal Server Error");
        }

        db.query(fibreSql, fibreParams, (err, submissions) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Internal Server Error");
          }

          // Wireless form submissions with pagination
          let wirelessSql = "SELECT * FROM wireless_forms";
          let wirelessParams = [];
          
          if (search) {
            wirelessSql += " WHERE email LIKE ? OR user_id LIKE ?";
            wirelessParams = [`%${search}%`, `%${search}%`];
          }
          
          const wirelessCountSql = search ? 
            "SELECT COUNT(*) as total FROM wireless_forms WHERE email LIKE ? OR user_id LIKE ?" :
            "SELECT COUNT(*) as total FROM wireless_forms";
          
          wirelessSql += " ORDER BY id DESC LIMIT ? OFFSET ?";
          wirelessParams.push(entriesPerPage, offset);

          db.query(wirelessCountSql, search ? [`%${search}%`, `%${search}%`] : [], (err, wirelessCountResult) => {
            if (err) {
              console.error("Database query error:", err);
              return res.status(500).send("Internal Server Error");
            }

            db.query(wirelessSql, wirelessParams, (err, wirelessForms) => {
              if (err) {
                console.error("Database query error:", err);
                return res.status(500).send("Internal Server Error");
              }

              // Assigned equipment
              const assignedEquipmentSql = "SELECT * FROM assigned_equipment";
              db.query(assignedEquipmentSql, (err, assigned_equipment) => {
                if (err) {
                  console.error("Database query error:", err);
                  return res.status(500).send("Internal Server Error");
                }

                // Fetch packages from database
                const packagesSql = "SELECT id, Package, Price FROM packages ORDER BY id ASC";
                db.query(packagesSql, (err, packages) => {
                  if (err) {
                    console.error("Database query error fetching packages:", err);
                    return res.status(500).send("Internal Server Error");
                  }
                  
                  console.log("Fetched packages:", packages);
                  console.log("Package count:", packages ? packages.length : 0);

            const backgroundSql = "SELECT * FROM nav_table";
            db.query(backgroundSql, (err, bg_result) => {
              if (err) {
                console.error("Database query error:", err);
                return res.status(500).send("Internal Server Error");
              }

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

                  const totalNotifactions =
                    NotifactionResult[0].totalNotifactions;

                  // Flash messages
                  const successMsg = req.flash("success");
                  const errorMsg = req.flash("error");

                  const isAdmin = "admin";
                  const isUser =
                    req.session.user && req.session.user.role === "user";

                  // Calculate pagination data
                  const fibreTotalEntries = fibreCountResult[0].total;
                  const wirelessTotalEntries = wirelessCountResult[0].total;
                  const totalEntries = fibreTotalEntries + wirelessTotalEntries;
                  const totalPages = Math.ceil(totalEntries / entriesPerPage);
                  const startIndex = (page - 1) * entriesPerPage + 1;
                  const endIndex = Math.min(startIndex + submissions.length + wirelessForms.length - 1, totalEntries);

                  res.render("userEquipment/AssignEquipment", {
                    user: results,
                    slider: sliderResults,
                    message: null,
                    isAdmin,
                    isUser,
                    bg_result,

                    submissions,
                    wirelessForms,
                    assigned_equipment,
                    packages,
                    totalNotifactions,
                    password_datass,
                    messages: {
                      success: successMsg.length > 0 ? successMsg[0] : null,
                      error: errorMsg.length > 0 ? errorMsg[0] : null,
                    },
                    
                    // Pagination data
                    page,
                    totalPages,
                    totalEntries,
                    entriesPerPage,
                    startIndex,
                    endIndex,
                    search,
                    fibreTotalEntries,
                    wirelessTotalEntries
                  });
                }); // NotifactionSql query
              }); // passwordSql query  
            }); // backgroundSql query
          }); // packagesSql query
        }); // assignedEquipmentSql query
        }); // wirelessSql query
      }); // wirelessCountSql query
    }); // fibreSql query
  }); // fibreCountSql query
    }); // sqlSlider query
  }); // sqlProfile query
};
// delete submission form
exports.deleteFibreSubmission = (req, res) => {
  const id = req.params.id;

  const deleteQuery = `DELETE FROM fibre_form_submissions WHERE id = ?`;

  db.query(deleteQuery, [id], (err) => {
    if (err) {
      console.error("Error deleting fibre submission:", err);
      return res.status(500).send("Database error");
    }
    req.flash("success", "Fibre submission deleted successfully!");
    res.redirect("/AssignEquipment");
  });
};

// delete wireless form
exports.deleteWirelessSubmission = (req, res) => {
  const userId = req.params.id;
  delQuery = `DELETE FROM wireless_forms WHERE id = ?`;
  db.query(delQuery, [userId], (err) => {
    if (err) {
      console.error("Error deleting wireless submission:", err);
      return res.status(500).send("Database error");
    }
    req.flash("success", "Wireless submission deleted successfully!");
    res.redirect("/AssignEquipment");
  });
};

// Update Fibre Submission
const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
const updateStock = (db, type, name, quantityDiff, unit, callback) => {
  // Normalize type
  type = type.toLowerCase().trim();

  // Normalize name: map 'Cat6 Wire' or 'cat 6 wire' to 'Cat 6 Wire'
  const originalName = name.trim();
  const lowerName = originalName.toLowerCase();
  const stockName =
    lowerName === "cat6 wire" || lowerName === "cat 6 wire"
      ? "Cat 6 Wire"
      : originalName;

  // Map type to category
  const category =
    type === "wireless"
      ? "Wireless Devices"
      : type === "fibre"
      ? "Fibre Optics"
      : type;

  // Define device names that allow positive quantityDiff for restoration
  const deviceNames = [
    "Light Beam-M5",
    "Light Beam-AC",
    "Power Beam-M5",
    "Power Beam-AC",
    "Nano-station",
    "Outdoor Router",
    "TP-Link",
    "China",
    "Net gear",
    "Fibrish",
    "Click Opticx",
    "D-11",
    "X-pon",
    "E-pon",
    "G-pon",
    "tyty",
  ];

  // Allow positive quantityDiff for fibre cables (e.g., Fibre Cable X core) and devices
  const qtyDiff =
    deviceNames.includes(stockName) || stockName.startsWith("Fibre Cable")
      ? quantityDiff
      : -Math.abs(quantityDiff);

  // Debug: Log inputs
  console.log(`[updateStock] Version 2025-05-27`);
  console.log(
    `[updateStock] Input - type: '${type}', name: '${originalName}', stockName: '${stockName}', quantityDiff: ${quantityDiff}, qtyDiff: ${qtyDiff}, unit: '${unit}', category: '${category}'`
  );

  // Query using category and case-insensitive name, with TRIM to handle whitespace
  const query = `SELECT id, quantity, name, unit, category FROM equipment_stock WHERE LOWER(TRIM(name)) = ? AND LOWER(TRIM(category)) = ?`;
  db.query(query, [lowerName, category.toLowerCase()], (err, results) => {
    if (err) {
      console.error("[updateStock] Error fetching stock:", err);
      return callback(err);
    }

    console.log(
      `[updateStock] Query results for name: '${stockName}', category: '${category}', results:`,
      results
    );

    if (results.length === 0) {
      console.error(
        `[updateStock] Equipment '${stockName}' not found in stock for category '${category}'`
      );
      return callback(
        new Error(
          `Equipment '${stockName}' not found in stock for category '${category}'. Please add it to inventory.`
        )
      );
    }

    const currentQuantity = results[0].quantity;
    console.log(
      `[updateStock] Found stock - id: ${results[0].id}, name: '${results[0].name}', quantity: '${currentQuantity}', unit: '${results[0].unit}'`
    );
    proceedWithUpdate(currentQuantity, results[0].id, results[0].unit);

    function proceedWithUpdate(currentQuantity, itemId, detectedUnit) {
      const quantityStr = String(currentQuantity || "0").trim();
      console.log(
        `[updateStock] Processing - quantity: '${quantityStr}', qtyDiff: ${qtyDiff}, itemId: ${itemId}`
      );

      let currentNumber = 0;
      const match = quantityStr.match(/^(\d+)\s*(\w+)?$/);
      if (match) {
        currentNumber = parseInt(match[1]) || 0;
      } else {
        console.warn(
          `[updateStock] Invalid quantity format: '${quantityStr}', defaulting to 0`
        );
      }

      const newNumber = currentNumber + qtyDiff;

      if (newNumber < 0) {
        const error = new Error(
          `Insufficient stock for '${stockName}'. Available: ${currentNumber}, Requested: ${Math.abs(
            qtyDiff
          )}`
        );
        console.error("[updateStock] Stock error:", error.message);
        return callback(error);
      }

      const finalUnit = unit || detectedUnit || "";
      const updatedQuantity = finalUnit
        ? `${newNumber} ${finalUnit}`.trim()
        : `${newNumber}`;
      db.query(
        `UPDATE equipment_stock SET quantity = ? WHERE id = ?`,
        [updatedQuantity, itemId],
        (err) => {
          if (err) {
            console.error("[updateStock] Error updating stock:", err);
            return callback(err);
          }
          console.log(
            `[updateStock] Updated stock - id: ${itemId}, name: '${stockName}', quantity: '${updatedQuantity}'`
          );
          callback(null);
        }
      );
    }
  });
};

exports.updateFibreSubmission = (req, res) => {
  const id = req.params.id;
  const {
    user_pay,
    company_pay,
    email,
    formType,
    selected_package,
    package_price,
    device_label,
    device_label_custom,
    device_price,
    fibre_power_label,
    fibre_power_price,
    fibre_color_value,
    fibre_supplying_value,
    cable_quantity,
    cable_price,
    splitter_value,
    splitter_value_custom,
    duck_patti_quantity,
    duck_patti_price,
    patch_card_quantity,
    patch_card_price
  } = req.body;

  db.beginTransaction((err) => {
    if (err) {
      console.error("[updateFibreSubmission] Transaction error:", err);
      req.flash("error", "Transaction failed");
      return res.redirect("/userEquipment");
    }

    // Final values for device and splitter
    let finalDeviceLabel =
      device_label === "Other" && device_label_custom
        ? device_label_custom
        : device_label || "";

    const validSplitters = ["2way", "4way", "5/95", "10/90", "20/80", "8way"];
    const splitterMap = {
      "2way": "Splitter 2way",
      "4way": "Splitter 4way",
      "5/95": "Splitter 5/95 Way",
      "10/90": "Splitter 10/90 Way",
      "20/80": "Splitter 20/80 Way",
      "8way": "Splitter 8way",
    };

    let finalSplitterValue = splitter_value;
    if (splitter_value === "Other" && splitter_value_custom) {
      finalSplitterValue = splitter_value_custom;
    } else if (validSplitters.includes(splitter_value)) {
      finalSplitterValue = splitterMap[splitter_value];
    } else {
      return db.rollback(() => {
        req.flash("error", `Invalid splitter value: ${splitter_value}`);
        return res.redirect("/userEquipment");
      });
    }

    // Update main fibre submission
    const updateQuery = `
      UPDATE fibre_form_submissions SET
        user_pay=?, company_pay=?, email=?, formType=?,
        first_package_price=?, device_label=?, device_price=?,
        fibre_power_label=?, fibre_power_price=?, fibre_color_value=?,
        fibre_supplying_value=?, cable_quantity=?, cable_price=?,
        splitter_value=?, duck_patti_quantity=?, duck_patti_price=?,
        patch_card_quantity=?, patch_card_price=?
      WHERE id=?`;

    const updateValues = [
      user_pay,
      company_pay,
      email,
      formType || "fibre",
      package_price, // Save the package price
      finalDeviceLabel,
      device_price,
      fibre_power_label,
      fibre_power_price,
      fibre_color_value,
      fibre_supplying_value,
      cable_quantity,
      cable_price,
      finalSplitterValue,
      duck_patti_quantity,
      duck_patti_price,
      patch_card_quantity,
      patch_card_price,
      id,
    ];

    db.query(updateQuery, updateValues, (err) => {
      if (err) {
        return db.rollback(() => {
          console.error("[updateFibreSubmission] Error updating:", err);
          req.flash("error", "Database update failed");
          return res.redirect("/userEquipment");
        });
      }

      db.commit((err) => {
        if (err) {
          return db.rollback(() => {
            console.error("[updateFibreSubmission] Commit failed:", err);
            req.flash("error", "Transaction commit failed");
            return res.redirect("/userEquipment");
          });
        }
        req.flash("success", "Fibre user updated successfully");
        return res.redirect("/userEquipment");
      });
    });
  });
};

exports.updateWirelessForm = (req, res) => {
  const id = req.params.id;
  const {
    user_pay,
    company_pay,
    cat6_quantity,
    cat6_price,
    selected_package,
    package_price,
    clips_quantity,
    clips_price,
    raval_bold_pair,
    raval_bold_price,
    poll_height,
    poll_price,
    signal_strength,
    home_tower_height,
    signal_receiver,
    signal_receiver_custom,
    receiver_price,
    receiver_model,
    wifi_onu,
    wifi_onu_custom,
    onu_price,
    onu_model,
    tower_ap_device,
    tower_ap_device_custom,
    wireless_field,
    existing_equipment_id = [],
    existing_equipment_name = [],
    existing_equipment_quantity = [],
    existing_equipment_unit = [],
    existing_equipment_price = [],
    new_equipment_name = [],
    new_equipment_quantity = [],
    new_equipment_unit = [],
    new_equipment_price = [],
  } = req.body;

  // Debug: Log inputs
  console.log(
    `[updateWirelessForm] Updating ID: ${id}, cat6_quantity: '${cat6_quantity}', clips_quantity: '${clips_quantity}', raval_bold_pair: '${raval_bold_pair}'`
  );
  console.log(
    `[updateWirelessForm] Devices - signal_receiver: '${signal_receiver}', custom: '${signal_receiver_custom}', wifi_onu: '${wifi_onu}', custom: '${wifi_onu_custom}', tower_ap_device: '${tower_ap_device}', custom: '${tower_ap_device_custom}'`
  );
  console.log(
    `[updateWirelessForm] Existing equipment:`,
    existing_equipment_name,
    existing_equipment_quantity
  );
  console.log(
    `[updateWirelessForm] New equipment:`,
    new_equipment_name,
    new_equipment_quantity
  );

  db.beginTransaction((err) => {
    if (err) {
      console.error("[updateWirelessForm] Transaction error:", err);
      req.flash("error", "Transaction failed");
      return res.redirect("/userEquipment");
    }

    db.query(
      `SELECT * FROM wireless_forms WHERE id = ?`,
      [id],
      (err, results) => {
        if (err) {
          return db.rollback(() => {
            console.error(
              "[updateWirelessForm] Error fetching submission:",
              err
            );
            req.flash("error", "Database fetch failed");
            res.redirect("/userEquipment");
          });
        }
        if (results.length === 0) {
          return db.rollback(() => {
            req.flash("error", "Submission not found");
            res.redirect("/userEquipment");
          });
        }
        const original = results[0];

        db.query(
          `SELECT id, equipment_name, quantity, unit, price FROM assigned_equipment WHERE submission_type = 'wireless' AND submission_id = ?`,
          [id],
          (err, existingEquipment) => {
            if (err) {
              return db.rollback(() => {
                console.error(
                  "[updateWirelessForm] Error fetching assigned equipment:",
                  err
                );
                req.flash("error", "Database fetch failed");
                res.redirect("/userEquipment");
              });
            }

            // Define valid devices
            const validReceivers = [
              "Light Beam-M5",
              "Light Beam-AC",
              "Power Beam-M5",
              "Power Beam-AC",
              "Nano-station",
              "Outdoor Router",
            ];
            const validOnus = ["TP-Link", "China", "Net gear"];
            const validTowers = ["Fibrish", "Click Opticx", "D-11"];

            // Determine final values for devices
            let finalSignalReceiver =
              signal_receiver === "Other" && signal_receiver_custom
                ? signal_receiver_custom
                : signal_receiver || "";
            let finalWifiOnu =
              wifi_onu === "Other" && wifi_onu_custom
                ? wifi_onu_custom
                : wifi_onu || "";
            let finalTowerApDevice =
              tower_ap_device === "Other" && tower_ap_device_custom
                ? tower_ap_device_custom
                : tower_ap_device || "";

            // Determine if stock updates should occur
            const isReceiverValid = validReceivers.includes(signal_receiver);
            const isOnuValid = validOnus.includes(wifi_onu);
            const isTowerValid = validTowers.includes(tower_ap_device);

            const stockUpdates = [];

            // Function to check if equipment exists in stock
            const checkEquipmentExists = (name, callback) => {
              db.query(
                `SELECT id FROM equipment_stock WHERE LOWER(name) = ? AND LOWER(TRIM(category)) = ?`,
                [name.toLowerCase(), "wireless devices"],
                (err, results) => {
                  if (err) {
                    console.error(
                      "[updateWirelessForm] Error checking equipment existence:",
                      err
                    );
                    return callback(err);
                  }
                  callback(null, results.length > 0);
                }
              );
            };

            // Handle cat6_quantity
            if (
              cat6_quantity &&
              cat6_quantity !== (original.cat6_quantity || null)
            ) {
              const originalMatch = original.cat6_quantity
                ? original.cat6_quantity.match(/(\d+)\s*meter/)
                : null;
              const newMatch = cat6_quantity.match(/(\d+)\s*meter/);
              const originalMeters = originalMatch
                ? parseInt(originalMatch[1])
                : 0;
              const newMeters = newMatch ? parseInt(newMatch[1]) : 0;
              const delta = newMeters - originalMeters;
              if (delta > 0) {
                stockUpdates.push((cb) =>
                  updateStock(db, "wireless", "Cat 6 Wire", -delta, "meter", cb)
                );
                console.log(
                  `[updateWirelessForm] Reducing stock for Cat 6 Wire: ${-delta} meter`
                );
              }
            }

            // Handle clips_quantity
            if (
              clips_quantity &&
              clips_quantity !== (original.clips_quantity || null)
            ) {
              const originalMatch = original.clips_quantity
                ? original.clips_quantity.match(/(\d+)\s*clips/)
                : null;
              const newMatch = clips_quantity.match(/(\d+)\s*clips/);
              const originalClips = originalMatch
                ? parseInt(originalMatch[1])
                : 0;
              const newClips = newMatch ? parseInt(newMatch[1]) : 0;
              const delta = newClips - originalClips;
              if (delta > 0) {
                stockUpdates.push((cb) =>
                  updateStock(db, "wireless", "clips", -delta, "clips", cb)
                );
                console.log(
                  `[updateWirelessForm] Reducing stock for Clips: ${-delta}`
                );
              }
            }

            // Handle raval_bold_pair
            if (
              raval_bold_pair &&
              raval_bold_pair != original.raval_bold_pair
            ) {
              const originalPairs = parseInt(original.raval_bold_pair) || 0;
              const newPairs = parseInt(raval_bold_pair) || 0;
              const delta = newPairs - originalPairs;
              if (delta > 0) {
                stockUpdates.push((cb) =>
                  updateStock(db, "wireless", "raval bold", -delta, "pairs", cb)
                );
                console.log(
                  `[updateWirelessForm] Reducing stock for Raval Bold: ${-delta} pairs`
                );
              }
            }

            // Handle signal_receiver
            if (
              finalSignalReceiver &&
              finalSignalReceiver !== original.signal_receiver
            ) {
              // Restore original stock
              if (original.signal_receiver) {
                let restoreName = original.signal_receiver;
                if (
                  original.signal_receiver === "Other" &&
                  original.signal_receiver_custom
                ) {
                  restoreName = original.signal_receiver_custom;
                }
                if (
                  restoreName !== "Other" &&
                  (validReceivers.includes(restoreName) ||
                    original.signal_receiver === "Other")
                ) {
                  stockUpdates.push((cb) => {
                    checkEquipmentExists(restoreName, (err, exists) => {
                      if (err) return cb(err);
                      if (!exists) {
                        console.warn(
                          `[updateWirelessForm] Skipping restoration for '${restoreName}' (not in stock)`
                        );
                        return cb(null);
                      }
                      updateStock(db, "wireless", restoreName, 1, "", cb);
                      console.log(
                        `[updateWirelessForm] Restoring stock for signal_receiver: '${restoreName}' (+1)`
                      );
                    });
                  });
                }
              }
              // Reduce stock for new receiver
              if (
                (isReceiverValid && signal_receiver !== "Other") ||
                (signal_receiver === "Other" && signal_receiver_custom)
              ) {
                stockUpdates.push((cb) => {
                  checkEquipmentExists(finalSignalReceiver, (err, exists) => {
                    if (err) return cb(err);
                    if (!exists) {
                      console.warn(
                        `[updateWirelessForm] Skipping reduction for '${finalSignalReceiver}' (not in stock)`
                      );
                      return cb(null);
                    }
                    updateStock(
                      db,
                      "wireless",
                      finalSignalReceiver,
                      -1,
                      "",
                      cb
                    );
                    console.log(
                      `[updateWirelessForm] Reducing stock for signal_receiver: '${finalSignalReceiver}' (-1)`
                    );
                  });
                });
              }
            }

            // Handle wifi_onu
            if (finalWifiOnu && finalWifiOnu !== original.wifi_onu) {
              // Restore original stock
              if (original.wifi_onu) {
                let restoreName = original.wifi_onu;
                if (original.wifi_onu === "Other" && original.wifi_onu_custom) {
                  restoreName = original.wifi_onu_custom;
                }
                if (
                  restoreName !== "Other" &&
                  (validOnus.includes(restoreName) ||
                    original.wifi_onu === "Other")
                ) {
                  stockUpdates.push((cb) => {
                    checkEquipmentExists(restoreName, (err, exists) => {
                      if (err) return cb(err);
                      if (!exists) {
                        console.warn(
                          `[updateWirelessForm] Skipping restoration for '${restoreName}' (not in stock)`
                        );
                        return cb(null);
                      }
                      updateStock(db, "wireless", restoreName, 1, "", cb);
                      console.log(
                        `[updateWirelessForm] Restoring stock for wifi_onu: '${restoreName}' (+1)`
                      );
                    });
                  });
                }
              }
              // Reduce stock for new ONU
              if (
                (isOnuValid && wifi_onu !== "Other") ||
                (wifi_onu === "Other" && wifi_onu_custom)
              ) {
                stockUpdates.push((cb) => {
                  checkEquipmentExists(finalWifiOnu, (err, exists) => {
                    if (err) return cb(err);
                    if (!exists) {
                      console.warn(
                        `[updateWirelessForm] Skipping reduction for '${finalWifiOnu}' (not in stock)`
                      );
                      return cb(null);
                    }
                    updateStock(db, "wireless", finalWifiOnu, -1, "", cb);
                    console.log(
                      `[updateWirelessForm] Reducing stock for wifi_onu: '${finalWifiOnu}' (-1)`
                    );
                  });
                });
              }
            }

            // Handle tower_ap_device
            if (
              finalTowerApDevice &&
              finalTowerApDevice !== original.tower_ap_device
            ) {
              // Restore original stock
              if (original.tower_ap_device) {
                let restoreName = original.tower_ap_device;
                if (
                  original.tower_ap_device === "Other" &&
                  original.tower_ap_device_custom
                ) {
                  restoreName = original.tower_ap_device_custom;
                }
                if (
                  restoreName !== "Other" &&
                  (validTowers.includes(restoreName) ||
                    original.tower_ap_device === "Other")
                ) {
                  stockUpdates.push((cb) => {
                    checkEquipmentExists(restoreName, (err, exists) => {
                      if (err) return cb(err);
                      if (!exists) {
                        console.warn(
                          `[updateWirelessForm] Skipping restoration for '${restoreName}' (not in stock)`
                        );
                        return cb(null);
                      }
                      updateStock(db, "wireless", restoreName, 1, "", cb);
                      console.log(
                        `[updateWirelessForm] Restoring stock for tower_ap_device: '${restoreName}' (+1)`
                      );
                    });
                  });
                }
              }
              // Reduce stock for new tower device
              if (
                (isTowerValid && tower_ap_device !== "Other") ||
                (tower_ap_device === "Other" && tower_ap_device_custom)
              ) {
                stockUpdates.push((cb) => {
                  checkEquipmentExists(finalTowerApDevice, (err, exists) => {
                    if (err) return cb(err);
                    if (!exists) {
                      console.warn(
                        `[updateWirelessForm] Skipping reduction for '${finalTowerApDevice}' (not in stock)`
                      );
                      return cb(null);
                    }
                    updateStock(db, "wireless", finalTowerApDevice, -1, "", cb);
                    console.log(
                      `[updateWirelessForm] Reducing stock for tower_ap_device: '${finalTowerApDevice}' (-1)`
                    );
                  });
                });
              }
            }

            // Handle existing equipment
            for (let i = 0; i < existing_equipment_id.length; i++) {
              const equipId = existing_equipment_id[i];
              const newName = existing_equipment_name[i] || "";
              const newQuantity = existing_equipment_quantity[i] || "";
              const newUnit = existing_equipment_unit[i] || "";
              const newPrice = existing_equipment_price[i] || null;

              const originalEquip = existingEquipment.find(
                (e) => e.id == equipId
              );
              if (!originalEquip) continue;

              // Only update stock if quantity or unit changed
              const isQuantityModified =
                newQuantity !== originalEquip.quantity ||
                newUnit !== (originalEquip.unit || "");

              if (isQuantityModified && newQuantity) {
                const originalQty =
                  parseInt(originalEquip.quantity.match(/\d+/)) || 0;
                const newQty = parseInt(newQuantity.match(/\d+/)) || 0;
                const delta = newQty - originalQty;
                const stockName =
                  newName.toLowerCase() === "cat6 wire"
                    ? "Cat 6 Wire"
                    : newName;
                if (delta > 0) {
                  stockUpdates.push((cb) => {
                    checkEquipmentExists(stockName, (err, exists) => {
                      if (err) return cb(err);
                      if (!exists) {
                        console.warn(
                          `[updateWirelessForm] Skipping reduction for '${stockName}' (not in stock)`
                        );
                        return cb(null);
                      }
                      updateStock(
                        db,
                        "wireless",
                        stockName,
                        -delta,
                        newUnit,
                        cb
                      );
                      console.log(
                        `[updateWirelessForm] Reducing stock for existing equipment: '${stockName}' (${-delta})`
                      );
                    });
                  });
                }
                stockUpdates.push((cb) => {
                  db.query(
                    `UPDATE assigned_equipment SET equipment_name = ?, quantity = ?, unit = ?, price = ? WHERE id = ?`,
                    [
                      newName,
                      newQuantity,
                      newUnit || null,
                      newPrice || null,
                      equipId,
                    ],
                    (err) => {
                      if (err) {
                        console.error(
                          "[updateWirelessForm] Error updating assigned equipment:",
                          err
                        );
                        return cb(err);
                      }
                      cb(null);
                    }
                  );
                });
              } else if (
                newName !== originalEquip.equipment_name ||
                newPrice !== (originalEquip.price || null)
              ) {
                // Update assigned equipment without stock change
                stockUpdates.push((cb) => {
                  db.query(
                    `UPDATE assigned_equipment SET equipment_name = ?, price = ? WHERE id = ?`,
                    [newName, newPrice || null, equipId],
                    (err) => {
                      if (err) {
                        console.error(
                          "[updateWirelessForm] Error updating assigned equipment:",
                          err
                        );
                        return cb(err);
                      }
                      cb(null);
                    }
                  );
                });
              }
            }

            // Handle new equipment
            for (let i = 0; i < new_equipment_name.length; i++) {
              const name = new_equipment_name[i];
              const quantity = new_equipment_quantity[i];
              const unit = new_equipment_unit[i] || "";
              const price = new_equipment_price[i] || null;

              if (name && quantity) {
                const qty = parseInt(quantity.match(/\d+/)) || 0;
                const stockName =
                  name.toLowerCase() === "cat6 wire" ? "Cat 6 Wire" : name;
                if (qty > 0) {
                  stockUpdates.push((cb) => {
                    checkEquipmentExists(stockName, (err, exists) => {
                      if (err) return cb(err);
                      if (!exists) {
                        console.warn(
                          `[updateWirelessForm] Skipping reduction for '${stockName}' (not in stock)`
                        );
                        return cb(null);
                      }
                      updateStock(db, "wireless", stockName, -qty, unit, cb);
                      console.log(
                        `[updateWirelessForm] Reducing stock for new equipment: '${stockName}' (${-qty})`
                      );
                    });
                  });
                }
                stockUpdates.push((cb) => {
                  db.query(
                    `INSERT INTO assigned_equipment (submission_type, submission_id, equipment_name, quantity, unit, price)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                      "wireless",
                      id,
                      stockName,
                      quantity,
                      unit || null,
                      price || null,
                    ],
                    (err) => {
                      if (err) {
                        console.error(
                          "[updateWirelessForm] Error inserting new equipment:",
                          err
                        );
                        return cb(err);
                      }
                      cb(null);
                    }
                  );
                });
              }
            }

            require("async").series(stockUpdates, (err) => {
              if (err) {
                return db.rollback(() => {
                  console.error(
                    "[updateWirelessForm] Stock update error:",
                    err
                  );
                  req.flash("error", err.message);
                  res.redirect("/userEquipment");
                });
              }

              const signalStrengthValue = signal_strength
                ? `${signal_strength}-dBi`
                : null;

              db.query(
                `UPDATE wireless_forms SET
               user_pay = ?, company_pay = ?, cat6_quantity = ?, cat6_price = ?,
               first_package_price = ?, clips_quantity = ?, clips_price = ?,
               raval_bold_pair = ?, raval_bold_price = ?, poll_height = ?, poll_price = ?,
               signal_strength = ?, home_tower_height = ?, signal_receiver = ?,
               receiver_price = ?, receiver_model = ?, wifi_onu = ?, onu_price = ?,
               onu_model = ?, tower_ap_device = ?, wireless_field = ?
               WHERE id = ?`,
                [
                  user_pay,
                  company_pay,
                  cat6_quantity,
                  cat6_price,
                  package_price, // Save the package price
                  clips_quantity,
                  clips_price,
                  raval_bold_pair,
                  raval_bold_price,
                  poll_height,
                  poll_price,
                  signalStrengthValue,
                  home_tower_height,
                  finalSignalReceiver,
                  receiver_price,
                  receiver_model,
                  finalWifiOnu,
                  onu_price,
                  onu_model,
                  finalTowerApDevice,
                  wireless_field,
                  id,
                ],
                (err) => {
                  if (err) {
                    return db.rollback(() => {
                      console.error(
                        "[updateWirelessForm] Error updating submission:",
                        err
                      );
                      req.flash("error", "Database update failed");
                      res.redirect("/userEquipment");
                    });
                  }

                  db.commit((err) => {
                    if (err) {
                      return db.rollback(() => {
                        console.error(
                          "[updateWirelessForm] Commit error:",
                          err
                        );
                        req.flash("error", "Transaction commit failed");
                        res.redirect("/userEquipment");
                      });
                    }
                    req.flash("success", "Equipment updated successfully");
                    res.redirect("/userEquipment");
                  });
                }
              );
            });
          }
        );
      }
    );
  });
};
exports.updateStockRoute = (req, res) => {
  const { type, name, quantityDiff, unit } = req.body;

  // Validate inputs
  if (!type || !name || quantityDiff === undefined) {
    return res
      .status(400)
      .send("Missing required fields: type, name, quantityDiff");
  }

  // Call updateStock with the provided parameters
  updateStock(type, name, parseInt(quantityDiff), unit || "", db, (err) => {
    if (err) {
      console.error("Error in updateStockRoute:", err);
      return res.status(500).send(err.message);
    }
    req.flash("success", `Stock updated successfully for ${name}!`);
    res.redirect("/AssignEquipment"); // Redirect to the equipment assignment page
  });
};
