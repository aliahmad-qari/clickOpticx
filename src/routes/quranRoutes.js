const express = require("express");
const router = express.Router();
const {
  profile,

} = require("../controllers/quranController");

// Get profile
router.get("/quran", profile);


module.exports = router;
