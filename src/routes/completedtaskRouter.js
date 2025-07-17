const express = require("express");
const router = express.Router();
const { profile,sendCoin,deleteTask } = require("../controllers/completedTaskController");

router.get("/CompletedTask", profile);

router.post('/send-coin', sendCoin);

router.post('/delete-task/:id', deleteTask);

module.exports = router;