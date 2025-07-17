const express = require("express");
const router = express.Router();

const { profile, UpdateUser, DeleteUser, getPayments,sendRespit} = require("../controllers/requestController");

router.get("/request", profile);
router.post("/update-plan", UpdateUser);
router.delete("/request/:id", DeleteUser);
router.get("/payments", getPayments);

router.post('/send-respit', sendRespit);

module.exports = router;
