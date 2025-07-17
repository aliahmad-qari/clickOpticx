const express = require("express");
const router = express.Router();

const AddPackages = require("../../controllers/AddPackages_Controller/AddPackageController");

router.get("/AddPackages", AddPackages.AddPackages);

router.post("/custom", AddPackages.insertPackage);

module.exports = router;
