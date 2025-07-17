const express = require("express");
const router = express.Router();
const {  getViewAllEquipments, deleteEquipment, updateEquipment } = require('../controllers/ViewAllEquipmentsController');
const upload = require("../middlewares/uploadMiddleware"); // Adjust path to your multer setup

router.get("/ViewAllEquipments", getViewAllEquipments);
router.post('/deleteEquipment/:id', deleteEquipment);
router.post('/updateEquipment', upload.single('image'), updateEquipment);

module.exports = router;