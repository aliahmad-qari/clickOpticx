const express = require("express");
const router = express.Router();
const {  getViewAllEquipments, deleteEquipment, updateEquipment } = require('../controllers/ViewAllEquipmentsController');
const { upload } = require("../config/cloudinary");

router.get("/ViewAllEquipments", getViewAllEquipments);
router.post('/deleteEquipment/:id', deleteEquipment);
router.post('/updateEquipment', upload.single('image'), updateEquipment);

module.exports = router;