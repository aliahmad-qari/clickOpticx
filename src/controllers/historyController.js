const db = require("../config/db");
const moment = require("moment");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
exports.profile = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    console.error("User ID is missing in the session.");
    return res.redirect("/");
  }

  try {
    // 1. Fetch user profile info
    const [userResults] = await db.promise().query(
      `SELECT id, Username, Email, plan, invoice, created_at, user_img, role 
       FROM users WHERE id = ?`, 
      [userId]
    );

    if (userResults.length === 0) {
      return res.status(404).send("User not found");
    }
    const user = userResults[0];
    const packageName = user.plan;

    // 2. Fetch discount info based on user's plan
    const [discountResults] = await db.promise().query(
      `SELECT discountPercentage FROM packages WHERE Speed = ?`,
      [packageName]
    );
    const discount = discountResults.length > 0 ? discountResults[0].discountPercentage : 0.00;

    // 3. Fetch background data for nav (if needed)
    const [bg_result] = await db.promise().query(`SELECT * FROM nav_table`);

    // --- Pagination setup for respits ---
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    // 4. Get total count of respits for this user
    const [[{ count }]] = await db.promise().query(
      `SELECT COUNT(*) AS count 
       FROM respits r
       JOIN users u ON r.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    const totalPages = Math.ceil(count / limit);

    // 5. Fetch paginated respits records joined with user info
    const [respitsResults] = await db.promise().query(
      `SELECT r.*, u.Username, u.Email, u.plan
       FROM respits r
       JOIN users u ON r.user_id = u.id
       WHERE u.id = ?
       ORDER BY r.id DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    user.created_at = moment(user.created_at).format("YYYY-MM-DD");

    // 6. Fetch notifications count for user
    const [Notifaction] = await db.promise().query(
      `SELECT COUNT(*) AS Notifactions 
       FROM notifications_user 
       WHERE user_id = ? AND is_read = 0 
       AND created_at >= NOW() - INTERVAL 2 DAY`,
      [userId]
    );

    const Notifactions = Notifaction[0].Notifactions;

    // 7. Fetch notifications details
    const [notifications_users] = await db.promise().query(
      `SELECT * FROM notifications_user 
       WHERE user_id = ? 
       AND is_read = 0 
       AND created_at >= NOW() - INTERVAL 2 DAY 
       ORDER BY id DESC`,
      [userId]
    );

    const isAdmin = user.role === "admin";
    const isUser = user.role === "user";

    // 8. Fetch payments for user
    const [paymentResults] = await db.promise().query(
      `SELECT * FROM payments WHERE user_id = ?`,
      [userId]
    );

    paymentResults.forEach(payment => {
      payment.created_at = moment(payment.created_at).format("YYYY-MM-DD");
    });

    // 9. Render the profile/history page with pagination data for respits
    res.render("History/History", {
      user,
      message: null,
      isAdmin,
      isUser,
      payments: paymentResults,
      bg_result,
      notifications_users,
      Notifactions,
      packages: respitsResults, // your paginated respits data
      discount,
      package: { package_name: packageName },
      currentPage: page,
      totalPages,
      totalResults: count
    });

  } catch (err) {
    console.error("Error in profile controller:", err);
    res.status(500).send("Server Error");
  }
};



exports.deletePackageById = (req, res) => {
  const id = req.body.id;
  const userId = req.session.userId;

  if (!id || !userId) {
    return res.status(400).send('Missing data');
  }

  // Make sure this invoice belongs to the logged-in user
  const checkOwnershipSql = 'SELECT user_id FROM respits WHERE id = ?';
  db.query(checkOwnershipSql, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(403).send('Unauthorized or invoice not found');
    }

    if (results[0].user_id !== userId) {
      return res.status(403).send('You cannot delete others\' invoices');
    }

    const deleteSql = 'DELETE FROM respits WHERE id = ?';
    db.query(deleteSql, [id], (err) => {
      if (err) return res.status(500).send('Server Error');
      res.redirect('/History');
    });
  });
};

const PDFDocument = require('pdfkit');

exports.downloadInvoiceById = (req, res) => {
  const invoiceId = req.params.id;
  const userId = req.session.userId;

  if (!invoiceId || !userId) {
    return res.status(400).send('Missing data');
  }

  // First verify if invoice belongs to this user
  const query = `
    SELECT r.*, u.Username, u.Email 
    FROM respits r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ? AND u.id = ?
  `;
  db.query(query, [invoiceId, userId], (err, results) => {
    if (err) {
      console.error('DB error during invoice lookup:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length === 0) {
      return res.status(403).send('Invoice not found or access denied');
    }

    const invoice = results[0];

    // Create PDF
    const doc = new PDFDocument();
    const filename = `invoice-${invoice.id}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice ID: ${invoice.id}`);
    doc.text(`Username: ${invoice.Username}`);
    doc.text(`Email: ${invoice.Email}`);
    doc.text(`Plan: ${invoice.plan || 'N/A'}`);
    doc.text(`Date: ${moment(invoice.created_at).format("YYYY-MM-DD")}`);
    doc.text(`Amount: ${invoice.amount || 'N/A'}`);

    doc.end();
  });
};


exports.emailInvoiceById = (req, res) => {
  const invoiceId = req.params.id;
  const userId = req.session.userId;

  if (!invoiceId || !userId) {
    return res.status(400).send("Missing data");
  }

  const query = `
    SELECT r.*, u.Username, u.Email 
    FROM respits r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ? AND u.id = ?
  `;

  db.query(query, [invoiceId, userId], (err, results) => {
    if (err || results.length === 0) {
      console.error("Invoice fetch error:", err);
      return res.status(403).send("Invoice not found or access denied");
    }

    const invoice = results[0];
    const filename = `invoice-${invoice.id}.pdf`;
    const filePath = path.join(__dirname, "../../invoices", filename);

    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    // Generate PDF file
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${invoice.id}`);
    doc.text(`Username: ${invoice.Username}`);
    doc.text(`Email: ${invoice.Email}`);
    doc.text(`Plan: ${invoice.plan || "N/A"}`);
    doc.text(`Date: ${moment(invoice.created_at).format("YYYY-MM-DD")}`);
    doc.text(`Amount: ${invoice.amount || "N/A"}`);
    doc.end();

    writeStream.on("finish", () => {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "hamzahayat3029@gmail.com",
          pass: "ceud ztsg vqwr lmtl", // secure with env var
        },
      });

      const mailOptions = {
        from: "hamzahayat3029@gmail.com",
        to: invoice.Email,
        subject: "Your Invoice from ClickOpticx",
        text: "Please find your invoice attached.",
        attachments: [{ filename, path: filePath }],
      };

      transporter.sendMail(mailOptions, (err, info) => {
        fs.unlink(filePath, () => {}); // delete temp PDF

        if (err) {
          console.error("Email sending error:", err);
          return res.status(500).send("Failed to send invoice email.");
        }

        res.send("✅ Invoice emailed successfully.");
      });
    });
  });
};