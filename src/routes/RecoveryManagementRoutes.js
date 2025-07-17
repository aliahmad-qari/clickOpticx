const express = require("express");
const router = express.Router();
const { profile, deleteRecovery } = require("../controllers/RecoveryManagementController");

router.get("/RecoveryManagement", profile);
router.post('/delete-recovery/:id', deleteRecovery);

module.exports = router;