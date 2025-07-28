const express = require("express");
const router = express.Router();
const controller = require("../controllers/pandingpaymentsController");
const { isAuthenticated, isAdmin } = require("../middlewares/authMiddleware");

// 1. Render Slider and Pending Payments Page (Admin view)
router.get("/slider", isAuthenticated, isAdmin, controller.Slider_imgs);

// 2. Show Paid Users - API and EJS Page
router.get("/paid-users", isAuthenticated, isAdmin, controller.getPaidUsers);
router.get("/paid-users-page", isAuthenticated, isAdmin, controller.renderPaidUsersPage);

// 3. Main Pending Payments Page
router.get("/pandingpayments", isAuthenticated, isAdmin, controller.renderPendingPaymentsPage);

// 4. Show Packages by status - API and EJS Page
router.get("/packages-by-status", isAuthenticated, isAdmin, controller.getPackagesByStatus);
router.get("/packages-by-status-page", isAuthenticated, isAdmin, controller.renderPackagesByStatusPage);

// 5. Show ALL Package Requests - API and EJS Page
router.get("/all-package-requests", isAuthenticated, isAdmin, controller.getAllPackageRequests);
router.get("/all-package-requests-page", isAuthenticated, isAdmin, controller.renderAllPackageRequestsPage);

// 6. Show Pending Payments by User (user-wise) - API and EJS Page
router.get("/pending-payments", isAuthenticated, isAdmin, controller.getPendingPaymentsByUser);
router.get("/pending-by-user-page", isAuthenticated, isAdmin, controller.getPendingPaymentsByUser);

// 7. Show Manual Package Requests - API and EJS Page
router.get("/manual-package-requests", isAuthenticated, isAdmin, controller.getManualPackageRequests);
router.get("/manual-package-requests-page", isAuthenticated, isAdmin, controller.renderManualPackageRequestsPage);

// 8. Show Unpaid vs Active Users - API and EJS Page
router.get("/unpaid-vs-active", isAuthenticated, isAdmin, controller.getUnpaidVsActiveUsers);
router.get("/unpaid-vs-active-page", isAuthenticated, isAdmin, controller.renderUnpaidVsActiveUsersPage);

// 9. View All Payments (with optional search support)
router.get("/payments-history", controller.getPayments);

// 10. Delete a Payment Record
router.post("/delete-payment/:id", controller.deletePayment);

module.exports = router;
