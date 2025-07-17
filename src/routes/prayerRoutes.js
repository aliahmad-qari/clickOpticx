const express = require("express");
const router = express.Router();
const {
  profile,

} = require("../controllers/prayerController");

// Get profile
router.get("/prayer", profile);


module.exports = router;
