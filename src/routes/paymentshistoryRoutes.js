const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middlewares/authMiddleware");

const {
  Slider_imgs,
  getPayments,
  deletePayment,
  getPaidUsers,
  getUnpaidVsActiveUsers,
  getManualPackageRequests,
  getPackagesByStatus,
  getAllPackageRequests,
  getPendingPaymentsByUser,
  renderPaymentHistoryPage,
  renderPaymentAnalysisPage,
  renderPaymentReportsPage
} = require("../controllers/paymentshistroyController");

// Main payments history page
router.get("/paymentshistory", isAuthenticated, isAdmin, renderPaymentHistoryPage);

// Detailed pending by user page (renders EJS with data)
router.get("/pending-by-user", isAuthenticated, isAdmin, getPendingPaymentsByUser);

// API endpoints for AJAX calls
router.get("/api/payments", isAuthenticated, isAdmin, getPayments);
router.get("/api/paid-users", isAuthenticated, isAdmin, getPaidUsers);
router.get("/api/unpaid-vs-active", isAuthenticated, isAdmin, getUnpaidVsActiveUsers);
router.get("/api/manual-packages", isAuthenticated, isAdmin, getManualPackageRequests);
router.get("/api/packages/status", isAuthenticated, isAdmin, getPackagesByStatus);
router.get("/api/packages", isAuthenticated, isAdmin, getAllPackageRequests);

// Additional EJS page routes for payment history features
router.get("/payments-analysis", isAuthenticated, isAdmin, renderPaymentAnalysisPage);

router.get("/payment-reports", isAuthenticated, isAdmin, renderPaymentReportsPage);

// Delete payment action
router.post("/delete-payment/:id", deletePayment);

module.exports = router;
