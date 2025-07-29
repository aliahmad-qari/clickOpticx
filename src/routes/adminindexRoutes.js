const express = require("express");
const router = express.Router();

const {
  profile,
  insertPackagess,
  updatePackage,
  Newdata,
  getDashboardData,
} = require("../controllers/adminindexcontroller");

// Get profile
router.get("/adminIndex", profile);

// post Card
router.post("/Cards", insertPackagess);

// update Card
// Update package route
router.post("/Cards/update/:id", updatePackage);

router.post("/mark-one-read", Newdata);

// Real-time dashboard data endpoint
router.get("/api/dashboard-data", getDashboardData);

module.exports = router;
