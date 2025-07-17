const express = require("express");
const router = express.Router();
const {
  profile,

} = require("../controllers/weatherController");

// Get profile
router.get("/weather", profile);


module.exports = router;
