const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// Render login & register pages
router.get("/login", authController.loginPage);
router.get("/register", authController.register);

// Email verification route (NEW ✅)
router.get("/verify-email", authController.verifyEmail);

// Register user (sign up)
router.post("/register", authController.signup);

// Login user
router.post("/login", authController.signin);

// Logout user
router.get("/logout", authController.logout); // FIXED: was conflicting with home route

// Dashboard/profile route
router.get("/", authController.profile);

// Form selection & skipping
router.post("/select-form", authController.selectForm);
router.post("/skip-forms", authController.skipForms);

// Fibre & Wireless form submissions
router.post("/submit-fibre-form", authController.submitFibreForm);
router.post("/submit-wireless-form", authController.submitWirelessForm);

// Forgot password flow
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtpAndResetPassword);

module.exports = router;
