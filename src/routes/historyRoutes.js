const express = require("express");
const router = express.Router();

// Import controller functions
const {
  profile,
  deletePackageById,
  downloadInvoiceById
} = require("../controllers/historyController");

// 📄 History page (profile view with invoice listing)
router.get("/History", profile);

// 🗑 Delete invoice by user
router.post("/delete-package", deletePackageById);

// 📥 Download invoice as PDF
router.get("/download-invoice/:id", downloadInvoiceById);
const { emailInvoiceById } = require("../controllers/historyController");
router.get("/email-invoice/:id", emailInvoiceById);

module.exports = router;
