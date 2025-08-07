const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middlewares/authMiddleware");
const {
  updateSubscription,
  getPackage,
  updatePackage,
  insertPackage,
  deletePackage,
  adminDiscount,
  getPayFastToken,
  updateSubscriptionSuccess,
  handlePayFastITN,
  handlePaymentFailure,
} = require("../controllers/packageController");

// GET all packages
router.get("/package", isAuthenticated, getPackage);

// POST create a new package (Admin)
router.post("/package", isAuthenticated, isAdmin, insertPackage);

// PUT update a package (Admin)
router.post("/package/:id", isAuthenticated, isAdmin, updatePackage);

// DELETE a package (Admin)
router.delete("/package/:id", isAuthenticated, isAdmin, deletePackage);

// POST apply discount to a package (Admin)
router.post("/discount/:id", isAuthenticated, isAdmin, adminDiscount);

// POST update subscription (User)
router.post("/subscription", updateSubscription);

// POST get PayFast token for a package
router.post("/get-payfast-token", getPayFastToken);

// GET handle PayFast success callback
router.get("/success", updateSubscriptionSuccess);

// GET handle PayFast failure callback
router.get("/failure", handlePaymentFailure);

// POST handle PayFast ITN
router.post("/payfast-itn", handlePayFastITN);

module.exports = router;
