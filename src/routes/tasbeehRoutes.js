const express = require("express");
const router = express.Router();
const {
  profile,

} = require("../controllers/tasbeehController");

// Get profile
router.get("/tasbeeh", profile);


module.exports = router;
