const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../../middlewares/authMiddleware");

const AddPackages = require("../../controllers/AddPackages_Controller/AddPackageController");

router.get("/AddPackages", isAuthenticated, isAdmin, AddPackages.AddPackages);

router.post("/custom", isAuthenticated, isAdmin, AddPackages.insertPackage);

router.delete("/package/:id", isAuthenticated, isAdmin, AddPackages.deletePackage);

module.exports = router;
