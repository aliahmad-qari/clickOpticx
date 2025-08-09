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

    // 5.1 Also fetch direct payments for history
    const [directPayments] = await db.promise().query(
      `SELECT p.*, u.Username, u.Email, u.plan, p.package_name as Package, p.amount, p.custom_amount, p.created_at as Accepted
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE u.id = ?
       ORDER BY p.id DESC`,
      [userId]
    );

    // 5a. Fetch packages from payments joined with packages table
    const [paymentPackages] = await db.promise().query(
      `SELECT p.*, pay.*
       FROM packages p
       JOIN payments pay ON p.Package = pay.package_name
       WHERE pay.user_id = ?`,
      [userId]
    );

    // 5b. Merge respitsResults, directPayments, and paymentPackages into one array
    let mergedPackages = [...respitsResults, ...directPayments];

    // Format Accepted date to ISO string for filtering
    mergedPackages.forEach(pkg => {
      if (pkg.Accepted) {
        pkg.Accepted = moment(pkg.Accepted).format('YYYY-MM-DD');
      }
    });

    paymentPackages.forEach(paymentPackage => {
      // Check if package already exists in respitsResults by id or unique field
      const exists = mergedPackages.some(pkg => pkg.id === paymentPackage.id);
      if (!exists) {
        mergedPackages.push(paymentPackage);
      }
    });

    // Remove duplicates by id (if any)
    const uniquePackagesMap = new Map();
    mergedPackages.forEach(pkg => {
      if (!uniquePackagesMap.has(pkg.id)) {
        uniquePackagesMap.set(pkg.id, pkg);
      }
    });
    mergedPackages = Array.from(uniquePackagesMap.values());

    // Filter packages - show packages with any payment amount (including 0 custom_amount)
    mergedPackages = mergedPackages.filter(pkg => {
      // Always show if package has an amount (even if custom_amount is 0)
      if (pkg.amount && pkg.amount > 0) {
        return true;
      }
      // Also include if there's any custom_amount
      if (pkg.custom_amount && pkg.custom_amount > 0) {
        return true;
      }
      return false;
    });

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

    // Debug logging before rendering
    console.log('History Debug - mergedPackages length:', mergedPackages.length);
    console.log('History Debug - paymentResults length:', paymentResults.length);
    console.log('History Debug - respitsResults length:', respitsResults.length);
    
    // 9. Render the profile/history page with pagination data for respits and subscribed packages
    res.render("History/History", {
      user,
      message: null,
      isAdmin,
      isUser,
      payments: paymentResults,
      bg_result,
      notifications_users,
      Notifactions,
      packages: mergedPackages, // merged packages data including deleted/restored and subscribed
      discount,
      package: { package_name: packageName },
      currentPage: page,
      totalPages,
      totalResults: count,
      subscribedPackages: paymentPackages,
    });

  } catch (err) {
    console.error("Error in profile controller:", err);
    res.status(500).send("Server Error");
  }
};



exports.deletePackageById = (req, res) => {
  const id = req.body.id;
  const userId = req.session.userId;
  const type = req.body.type || 'respits'; // default to respits if not provided

  if (!id || !userId) {
    return res.status(400).send('Missing data');
  }

  let checkOwnershipSql = '';
  let deleteSql = '';

  if (type === 'respits') {
    checkOwnershipSql = 'SELECT user_id FROM respits WHERE id = ?';
    deleteSql = 'DELETE FROM respits WHERE id = ?';
  } else if (type === 'payments') {
    checkOwnershipSql = 'SELECT user_id FROM payments WHERE id = ?';
    deleteSql = 'DELETE FROM payments WHERE id = ?';
  } else {
    return res.status(400).send('Invalid package type');
  }

  db.query(checkOwnershipSql, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(403).send('Unauthorized or invoice not found');
    }

    if (results[0].user_id !== userId) {
      return res.status(403).send('You cannot delete others\' invoices');
    }

    db.query(deleteSql, [id], (err) => {
      if (err) return res.status(500).send('Server Error');
      res.redirect('/History');
    });
  });
};

const PDFDocument = require('pdfkit');

exports.downloadInvoiceById = async (req, res) => {
  const invoiceId = req.params.id;
  const userId = req.session.userId;

  if (!invoiceId || !userId) {
    return res.status(400).send('Missing data');
  }

  try {
    // First try to find the invoice in respits table
    const respitsQuery = `
      SELECT r.*, u.Username, u.Email, 'respits' as source_table
      FROM respits r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ? AND u.id = ?
    `;

    // Then try to find the invoice in payments table
    const paymentsQuery = `
      SELECT p.*, u.Username, u.Email, 'payments' as source_table,
             p.package_name as plan, p.amount, p.created_at
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND u.id = ?
    `;

    // Try respits table first
    const [respitsResults] = await db.promise().query(respitsQuery, [invoiceId, userId]);
    
    let invoice = null;
    
    if (respitsResults.length > 0) {
      invoice = respitsResults[0];
    } else {
      // If not found in respits, try payments table
      const [paymentsResults] = await db.promise().query(paymentsQuery, [invoiceId, userId]);
      
      if (paymentsResults.length > 0) {
        invoice = paymentsResults[0];
      }
    }

    if (!invoice) {
      console.error("Invoice not found in either respits or payments table for ID:", invoiceId);
      return res.status(403).send('Invoice not found or access denied');
    }

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
    doc.text(`Plan: ${invoice.plan || invoice.package_name || 'N/A'}`);
    doc.text(`Date: ${moment(invoice.created_at).format("YYYY-MM-DD")}`);
    doc.text(`Amount: ${invoice.amount || invoice.custom_amount || 'N/A'}`);
    doc.text(`Source: ${invoice.source_table}`);

    doc.end();

  } catch (error) {
    console.error('Error in downloadInvoiceById:', error);
    return res.status(500).send('Internal server error while processing invoice download.');
  }
};


exports.emailInvoiceById = async (req, res) => {
  const invoiceId = req.params.id;
  const userId = req.session.userId;

  if (!invoiceId || !userId) {
    return res.status(400).send("Missing data");
  }

  try {
    // First try to find the invoice in respits table
    const respitsQuery = `
      SELECT r.*, u.Username, u.Email, 'respits' as source_table
      FROM respits r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ? AND u.id = ?
    `;

    // Then try to find the invoice in payments table
    const paymentsQuery = `
      SELECT p.*, u.Username, u.Email, 'payments' as source_table,
             p.package_name as plan, p.amount, p.created_at
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND u.id = ?
    `;

    // Try respits table first
    const [respitsResults] = await db.promise().query(respitsQuery, [invoiceId, userId]);
    
    let invoice = null;
    
    if (respitsResults.length > 0) {
      invoice = respitsResults[0];
    } else {
      // If not found in respits, try payments table
      const [paymentsResults] = await db.promise().query(paymentsQuery, [invoiceId, userId]);
      
      if (paymentsResults.length > 0) {
        invoice = paymentsResults[0];
      }
    }

    if (!invoice) {
      console.error("Invoice not found in either respits or payments table for ID:", invoiceId);
      return res.status(403).send("Invoice not found or access denied");
    }

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
    doc.text(`Plan: ${invoice.plan || invoice.package_name || "N/A"}`);
    doc.text(`Date: ${moment(invoice.created_at).format("YYYY-MM-DD")}`);
    doc.text(`Amount: ${invoice.amount || invoice.custom_amount || "N/A"}`);
    doc.text(`Source: ${invoice.source_table}`);
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

        console.log(`✅ Invoice emailed successfully to ${invoice.Email} from ${invoice.source_table} table`);
        res.send("✅ Invoice emailed successfully.");
      });
    });

  } catch (error) {
    console.error("Error in emailInvoiceById:", error);
    return res.status(500).send("Internal server error while processing invoice email.");
  }
};
