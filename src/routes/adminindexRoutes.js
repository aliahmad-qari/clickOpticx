const express = require("express");
const router = express.Router();

const {
  profile,
  insertPackagess,
  updatePackage,
  Newdata,
} = require("../controllers/adminindexcontroller");

// Get profile
router.get("/adminIndex", profile);

// post Card
router.post("/Cards", insertPackagess);

// update Card
// Update package route
router.post("/Cards/update/:id", updatePackage);

router.post("/mark-one-read", Newdata);

module.exports = router;
