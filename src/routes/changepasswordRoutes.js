const express = require("express");
const router = express.Router();
const {
  profile,
  password,
} = require("../controllers/changepasswordController");

// Get profile
router.get("/changepassword", profile);

router.post("/changepassword", password);

module.exports = router;
