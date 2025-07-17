const express = require("express");
const router = express.Router();
const {
  AddEquipments,
  AddEquipment,
} = require("../controllers/AddNewEquipmentController");
const upload = require("../middlewares/uploadMiddleware");

router.get("/AddNewEquipment", AddEquipments);
router.post("/AddNewEquipment", upload.single("image"), AddEquipment);

module.exports = router;
