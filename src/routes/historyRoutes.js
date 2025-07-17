const express = require("express");
const router = express.Router();
const { profile,deletePackageById  } = require("../controllers/historyController");

router.get("/History", profile);


router.post('/delete-package', deletePackageById);


module.exports = router;
