const db = require("../config/db");
const axios = require("axios");
const crypto = require("crypto");
const NotificationService = require("../services/notificationService");
require("dotenv").config();

function generateRandomString(length = 4) {
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomString = "";
  for (let i = 0; i < length; i++) {
    randomString += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return randomString;
}

exports.updateSubscription = (req, res) => {
  const {
    user_id,
    username,
    transaction_id,
    amount,
    package_name,
    discount,
    custom_amount,
  } = req.body;

  const message = "Request for Package.";

  if (!user_id || !username || !transaction_id || !amount || !package_name) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  const packagePrice = parseFloat(amount) || 0;
  const customAmountFloat = parseFloat(custom_amount) || 0;

  console.log("🔍 Checking user_id in daily_tasks:", user_id);

  const getCoinBalanceQuery = `SELECT coin_balance FROM daily_tasks WHERE user_id = ?`;

  db.query(getCoinBalanceQuery, [user_id], (err, result) => {
    if (err) {
      console.error("❌ Error fetching coin_balance:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    // If user exists in daily_tasks
    if (result.length > 0) {
      const coinBalance = parseFloat(result[0].coin_balance) || 0;
      proceedWithPayment(coinBalance);
    } else {
      // Insert a new daily_tasks entry with 0 balance
      const insertDailyTask = `
        INSERT INTO daily_tasks (user_id, coin_balance)
        VALUES (?, 0)
      `;

      db.query(insertDailyTask, [user_id], (err) => {
        if (err) {
          console.error("❌ Error initializing daily task record:", err);
          // IGNORE error if it's due to duplicate entry (just in case)
          if (err.code === 'ER_DUP_ENTRY') {
            console.log("⚠️ Duplicate entry in daily_tasks, continuing...");
            proceedWithPayment(0);
          } else {
            return res.status(500).json({ success: false, message: "Error initializing daily task record" });
          }
        } else {
          console.log("✅ User inserted into daily_tasks with 0 balance.");
          proceedWithPayment(0);
        }
      });
    }
  });

  function proceedWithPayment(coinBalance) {
    const remainingAmount = packagePrice - customAmountFloat - coinBalance;

    const insertQuery = `
      INSERT INTO payments (
        user_id,
        username,
        transaction_id,
        amount,
        package_name,
        discount,
        custom_amount,
        remaining_amount,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    db.query(
      insertQuery,
      [
        user_id,
        username,
        transaction_id,
        packagePrice,
        package_name,
        discount,
        customAmountFloat,
        remainingAmount,
      ],
      (err) => {
        if (err) {
          console.error("❌ Error inserting into payments:", err);
          return res.status(500).json({ success: false, message: "Insert error" });
        }

        const updateCoinsQuery = `UPDATE daily_tasks SET coin_balance = 0 WHERE user_id = ?`;
        db.query(updateCoinsQuery, [user_id], (err) => {
          if (err) {
            console.error("❌ Error resetting coin_balance:", err);
            return res.status(500).json({ success: false, message: "Coin reset error" });
          }

          // Get user email for notification
          const getUserEmailQuery = "SELECT Email FROM users WHERE id = ?";
          db.query(getUserEmailQuery, [user_id], async (err, userResult) => {
            if (err) {
              console.error("❌ Error fetching user email:", err);
              return res.status(500).json({ success: false, message: "User fetch error" });
            }

            try {
              // Use the new notification service
              await NotificationService.handlePackageRequest({
                username: username,
                email: userResult.length > 0 ? userResult[0].Email : null,
                package_name: package_name,
                amount: packagePrice
              });

              console.log("✅ Done: Payment recorded, coins cleared, notification sent.");
              req.flash("success", "Your package request submitted successfully.");
              res.redirect("/package");
            } catch (notificationError) {
              console.error("❌ Error sending notifications:", notificationError);
              req.flash("success", "Your package request submitted successfully.");
              res.redirect("/package");
            }
          });
        });
      }
    );
  }
};


exports.getPayFastToken = async (req, res) => {
  const { packagePrice } = req.body;

  if (!packagePrice || isNaN(parseFloat(packagePrice))) {
    console.error("❌ Invalid packagePrice:", packagePrice);
    return res
      .status(400)
      .json({ success: false, message: "Valid package price is required" });
  }

  const merchant_id = process.env.PAYFAST_MERCHANT_ID;
  const secured_key = process.env.PAYFAST_SECURED_KEY;
  const basket_id = `ITEM-${generateRandomString(4)}`;
  const currency_code = "PKR";
  const trans_amount = parseFloat(packagePrice).toFixed(2);
  const order_date = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    const tokenApiUrl = `${process.env.PAYFAST_API_URL}/GetAccessToken`;
    const response = await axios.post(
      tokenApiUrl,
      {
        MERCHANT_ID: merchant_id,
        SECURED_KEY: secured_key,
        BASKET_ID: basket_id,
        TXNAMT: trans_amount,
        CURRENCY_CODE: currency_code,
      },
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const token = response.data.ACCESS_TOKEN || "";
    if (!token) {
      throw new Error("Empty token from PayFast");
    }

    const signatureData = `${merchant_id}${basket_id}${trans_amount}${currency_code}${secured_key}`;
    const signature = crypto
      .createHash("sha256")
      .update(signatureData)
      .digest("hex");

    res.json({
      success: true,
      merchant_id,
      basket_id,
      trans_amount,
      currency_code,
      token,
      signature,
      order_date,
    });
  } catch (error) {
    console.error(
      "❌ PayFast token error:",
      error.message,
      error.response?.data
    );
    res.status(400).json({
      success: false,
      message: "Failed to retrieve PayFast access token",
    });
  }
};

exports.updateSubscriptionSuccess = async (req, res) => {
  // console.log("Incoming request:", req.method, req.query, req.body);
  const { basket_id, transaction_amount, err_msg, transaction_id } =
    req.method === "GET" ? req.query : req.body;

  const BASKET_ID = basket_id;
  const TXNAMT = transaction_amount;
  const TRANSACTION_STATUS = err_msg;

  if (!BASKET_ID || TRANSACTION_STATUS !== "Success") {
    console.error("❌ Invalid or unsuccessful payment:", {
      BASKET_ID,
      TRANSACTION_STATUS,
    });
    req.flash("error", "Payment was not successful.");
    return res.redirect("/failure");
  }

  try {
    const findPaymentQuery = `
      SELECT * FROM payments 
      WHERE transaction_id = ? 
      LIMIT 1
    `;
    db.query(findPaymentQuery, [BASKET_ID], (err, paymentResults) => {
      if (err || paymentResults.length === 0) {
        console.error("❌ Payment not found:", err);
        req.flash("error", "Payment record not found.");
        return res.redirect("/failure");
      }

      const payment = paymentResults[0];

      if (
        parseFloat(TXNAMT).toFixed(2) !== parseFloat(payment.amount).toFixed(2)
      ) {
        console.error("❌ Amount mismatch:", {
          TXNAMT,
          dbAmount: payment.amount,
        });
        req.flash("error", "Payment amount mismatch.");
        return res.redirect("/failure");
      }

      const updatePaymentQuery = `
        UPDATE payments 
        SET active = 'Activated' 
        WHERE transaction_id = ?
      `;
      db.query(updatePaymentQuery, [BASKET_ID], (err) => {
        if (err) {
          console.error("❌ Error activating package:", err);
          req.flash("error", "Failed to activate package.");
          return res.redirect("/failure");
        }

        const updateUserQuery = `
          UPDATE users 
          SET invoice = 'Paid' 
          WHERE id = ?
        `;
        db.query(updateUserQuery, [payment.user_id], (err) => {
          if (err) {
            console.error("❌ Error updating user invoice:", err);
            req.flash("error", "Failed to update user status.");
            return res.redirect("/failure");
          }

          // Get user email for notification
          const getUserEmailQuery = "SELECT Email FROM users WHERE id = ?";
          db.query(getUserEmailQuery, [payment.user_id], async (err, userResult) => {
            if (err) {
              console.error("❌ Error fetching user email for success notification:", err);
            }

            try {
              // Use the new notification service for payment success
              await NotificationService.handleNewPayment({
                username: payment.username,
                email: userResult.length > 0 ? userResult[0].Email : null,
                package_name: payment.package_name,
                amount: payment.amount
              });
            } catch (notificationError) {
              console.error("❌ Error sending payment success notifications:", notificationError);
            }

            req.flash(
              "success",
              "Payment successful! Your package is now active."
            );
            res.redirect("/success"); // ✅ redirect to success page
          });
        });
      });
    });
  } catch (error) {
    console.error("❌ Unexpected error in success callback:", error.message);
    req.flash("error", "An unexpected error occurred.");
    res.redirect("/failure");
  }
};


exports.handlePaymentFailure = (req, res) => {
  req.flash("error", "Payment failed or was cancelled. Please try again.");
  res.redirect("/package");
};

exports.handlePayFastITN = async (req, res) => {
  const {
    pf_payment_id,
    payment_status,
    amount_gross,
    m_payment_id,
    signature,
  } = req.body;

  // Step 1: Verify signature (basic security check)
  const secured_key = process.env.PAYFAST_SECURED_KEY;
  const dataString = `pf_payment_id=${pf_payment_id}&payment_status=${payment_status}&amount_gross=${amount_gross}&m_payment_id=${m_payment_id}${secured_key}`;
  const generatedSignature = crypto
    .createHash("sha256")
    .update(dataString)
    .digest("hex");

  if (signature !== generatedSignature) {
    console.error("❌ Invalid ITN signature:", {
      received: signature,
      generated: generatedSignature,
    });
    return res.status(200).send("OK"); // PayFast requires 200 response
  }

  // Step 2: Check payment status
  if (payment_status !== "COMPLETE") {
    console.error("❌ ITN Payment not complete:", payment_status);
    return res.status(200).send("OK");
  }

  try {
    // Step 3: Find payment by transaction_id (m_payment_id)
    const findPaymentQuery = `
      SELECT * FROM payments 
      WHERE transaction_id = ? 
      LIMIT 1
    `;
    db.query(findPaymentQuery, [m_payment_id], (err, paymentResults) => {
      if (err || paymentResults.length === 0) {
        console.error("❌ ITN Payment not found:", err);
        return res.status(200).send("OK");
      }

      const payment = paymentResults[0];

      // Verify amount
      if (
        parseFloat(amount_gross).toFixed(2) !==
        parseFloat(payment.amount).toFixed(2)
      ) {
        console.error("❌ Amount mismatch in ITN:", {
          amount_gross,
          dbAmount: payment.amount,
        });
        return res.status(200).send("OK");
      }

      // Step 4: Update payment to active
      const updatePaymentQuery = `
        UPDATE payments 
        SET active = 'Activated' 
        WHERE transaction_id = ?
      `;
      db.query(updatePaymentQuery, [m_payment_id], (err) => {
        if (err) {
          console.error("❌ Error activating package in ITN:", err);
          return res.status(200).send("OK");
        }

        // Step 5: Update user invoice status
        const updateUserQuery = `
          UPDATE users 
          SET invoice = 'Paid' 
          WHERE id = ?
        `;
        db.query(updateUserQuery, [payment.user_id], (err) => {
          if (err) {
            console.error("❌ Error updating user invoice in ITN:", err);
            return res.status(200).send("OK");
          }

          // Step 6: Get user email and send notification
          const getUserEmailQuery = "SELECT Email FROM users WHERE id = ?";
          db.query(getUserEmailQuery, [payment.user_id], async (err, userResult) => {
            if (err) {
              console.error("❌ Error fetching user email for ITN notification:", err);
            }

            try {
              // Use the new notification service for PayFast payment
              await NotificationService.handleNewPayment({
                username: payment.username,
                email: userResult.length > 0 ? userResult[0].Email : null,
                package_name: payment.package_name,
                amount: payment.amount
              });
            } catch (notificationError) {
              console.error("❌ Error sending PayFast notifications:", notificationError);
            }

            res.redirect("/package");
          });
        });
      });
    });
  } catch (error) {
    console.error("❌ Unexpected error in ITN:", error.message);
    res.status(200).send("OK");
  }
};

exports.getPackage = async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }

  try {
    const sqlProfile = "SELECT * FROM users WHERE id = ?";
    db.query(sqlProfile, [userId], (err, userResults) => {
      if (err || userResults.length === 0) {
        console.error("User query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      const user = userResults[0];

      const subscriptionSql = `
        SELECT p.* FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ? AND p.active = 'Activated' AND u.invoice = 'Paid'
        ORDER BY p.created_at DESC
        LIMIT 1
      `;
      db.query(subscriptionSql, [userId], (err, subscriptionResults) => {
        if (err) {
          console.error("Subscription query error:", err);
          return res.status(500).send("Internal Server Error");
        }

        const subscription = subscriptionResults[0];

        const coinSql =
          "SELECT coin_balance FROM daily_tasks WHERE user_id = ?";
        db.query(coinSql, [userId], (err, coinResults) => {
          if (err) {
            console.error("Coin balance query error:", err);
            return res.status(500).send("Internal Server Error");
          }

          const coinBalance =
            coinResults.length > 0 ? coinResults[0].coin_balance : 0;

          const packageSql = `
            SELECT p.*, COUNT(u.id) AS userCount
            FROM packages p
            LEFT JOIN users u ON p.Package = u.plan
            GROUP BY p.id
          `;
          db.query(packageSql, async (err, packageResults) => {
            if (err) {
              console.error("Package query error:", err);
              return res.status(500).send("Internal Server Error");
            }

            db.query("SELECT * FROM nav_table", (err, bg_result) => {
              if (err) return res.status(500).send("Internal Server Error");

              db.query("SELECT * FROM data_entries", (err, password_data) => {
                if (err) return res.status(500).send("Internal Server Error");

                const notificationSql = `
                  SELECT * FROM notifications 
                  WHERE is_read = 0 
                  AND created_at >= NOW() - INTERVAL 2 DAY 
                  ORDER BY id DESC
                `;
                db.query(notificationSql, (err, password_datass) => {
                  if (err) return res.status(500).send("Internal Server Error");

                  const totalNotifSql = `
                    SELECT COUNT(*) AS totalNotifactions 
                    FROM notifications 
                    WHERE is_read = 0 
                    AND created_at >= NOW() - INTERVAL 2 DAY
                  `;
                  db.query(totalNotifSql, (err, NotifactionResult) => {
                    if (err)
                      return res.status(500).send("Internal Server Error");

                    const notifications_users_count_sql = `
                      SELECT COUNT(*) AS Notifactions 
                      FROM notifications_user 
                      WHERE user_id = ? AND is_read = 0 
                      AND created_at >= NOW() - INTERVAL 2 DAY
                    `;
                    db.query(
                      notifications_users_count_sql,
                      [userId],
                      (err, Notifaction) => {
                        if (err)
                          return res.status(500).send("Internal Server Error");

                        const Notifactions = Notifaction[0].Notifactions;

                        const notifications_details_sql = `
                          SELECT * FROM notifications_user 
                          WHERE user_id = ? 
                          AND is_read = 0 
                          AND created_at >= NOW() - INTERVAL 2 DAY 
                          ORDER BY id DESC
                        `;
                        db.query(
                          notifications_details_sql,
                          [userId],
                          (err, notifications_users) => {
                            if (err)
                              return res
                                .status(500)
                                .send("Internal Server Error");

                            const totalNotifactions =
                              NotifactionResult[0].totalNotifactions;
                            const successMsg = req.flash("success");
                            const errorMsg = req.flash("error");

                            const isAdmin = user.role === "admin";
                            const isUser = user.role === "user";

                            res.render("package/package", {
                              user,
                              packages: packageResults,
                              message: null,
                              isAdmin,
                              isUser,
                              password_data,
                              bg_result,
                              userCoinBalance: coinBalance,
                              subscription,
                              password_datass,
                              totalNotifactions,
                              messages: {
                                success:
                                  successMsg.length > 0 ? successMsg[0] : null,
                                error: errorMsg.length > 0 ? errorMsg[0] : null,
                              },
                              notifications_users,
                              Notifactions,
                            });
                          }
                        );
                      }
                    );
                  });
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

exports.insertPackage = (req, res) => {
  const { Package, Price, Speed, Data_Used, Offer_Valid, limits } = req.body;

  const sql = `INSERT INTO packages (Package, Price, Speed, Data_Used, Offer_Valid, limits, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [Package, Price, Speed, Data_Used, Offer_Valid, limits, req.session.userId],
    (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }
      req.flash("success", "Your package added successfully!");
      res.redirect("/package");
    }
  );
};

exports.updatePackage = (req, res) => {
  const { Package, Price, Speed, Data_Used, Offer_Valid, limits } = req.body;
  const packageId = req.params.id;

  const sql = `UPDATE packages SET Package = ?, Price = ?, Speed = ?, Data_Used = ?, Offer_Valid = ?, limits = ? WHERE id = ?`;
  db.query(
    sql,
    [Package, Price, Speed, Data_Used, Offer_Valid, limits, packageId],
    (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }
      if (result.affectedRows === 0) {
        return res.status(404).send("Package not found or unauthorized");
      }
      req.flash("success", "Package updated successfully!");
      res.redirect("/package");
    }
  );
};

exports.deletePackage = (req, res) => {
  const packageId = req.params.id;
  const deleteSql = "DELETE FROM packages WHERE id = ?";
  db.query(deleteSql, [packageId], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.flash("success", "Your package deleted successfully!");
    res.redirect("/package");
  });
};


exports.adminDiscount = (req, res) => {
  const { Price, discountPercentage, id } = req.body;

  if (discountPercentage) {
    const discountedPrice = Price - Price * (discountPercentage / 100);
    const sql =
      "UPDATE packages SET Price = ?, discountPercentage = ? WHERE id = ?";
    db.query(sql, [discountedPrice, discountPercentage, id], (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.redirect("/package");
      }
      req.flash("success", `Your will give ${discountPercentage}% discount!`);
      res.redirect("/package");
    });
  } else {
    const sql = "UPDATE packages SET Price = ? WHERE id = ?";
    db.query(sql, [Price, id], (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.redirect("/package");
      }
      res.redirect("/package");
    });
  }
};
