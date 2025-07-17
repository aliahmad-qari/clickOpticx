const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// Serve sign-up form
// router.get("/", (req, res) => {
//   res.render("login/login", { message: null });
// });
router.get('/login', authController.loginPage);
router.get("/", authController.profile);

// register route
router.post("/register", authController.signup);


// login route
router.post("/login", authController.signin);
router.get("/register", authController.register);
// slected form
router.post("/select-form", authController.selectForm);
// slected form
// submit fibre form
router.post("/submit-fibre-form", authController.submitFibreForm);
// submit fibre form

// submit wireless form
router.post("/submit-wireless-form", authController.submitWirelessForm);

// submit wireless form

router.post("/skip-forms", authController.skipForms);

// logout route
router.get("/", authController.logout);

router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtpAndResetPassword);

module.exports = router;