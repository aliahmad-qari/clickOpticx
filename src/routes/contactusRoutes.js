const express = require("express");
const router = express.Router();
const {
  profile,
  feedback,
  AllComplaint,
  UserComplaint,
} = require("../controllers/contactusController");

router.get("/contactUs", profile);
router.post("/submit-feedback", feedback);

// get the complaint of the user
router.get("/complaint", AllComplaint);

// post the complaint of the user
router.post("/complaint", UserComplaint);

module.exports = router;
