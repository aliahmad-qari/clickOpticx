const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const {
  profile,
  updatePassword,
  password,
  updateUser,
} = require("../controllers/profileController");

// Get profile
router.get("/profile", profile);

// Upload profile picture


router.post("/insert", password);

router.post("/update-profile", upload.single("profilePic"), updateUser);
router.post("/sett", updatePassword);

module.exports = router;
