const express = require("express");
const router = express.Router();
const {
  status,
  repairEquipment,
  markPermanentDamage,
} = require("../controllers/EquipmentStatusController");

router.get("/EquipmentStatus", status);
router.post("/repair-equipment/:id", repairEquipment);
router.post("/mark-permanent-damage/:id", markPermanentDamage);

module.exports = router;
