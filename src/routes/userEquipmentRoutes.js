const express = require("express");
const router = express.Router();
const {
    Slider_imgs,
    deleteFibreSubmission,
    updateFibreSubmission,
    deleteWirelessSubmission,
    updateWirelessForm,
} = require("../controllers/userEquipmentController");

router.get("/AssignEquipment",Slider_imgs);
// ssss
router.get("/userEquipment", Slider_imgs);
// Delete fibre submission form
router.post('/delete-fibre/:id', deleteFibreSubmission);
// update fibre submission form
router.post('/update-fibre/:id', updateFibreSubmission);
// delete wireless form
router.post('/delete-wireless/:id', deleteWirelessSubmission);
// update wireless form
router.post('/update-wireless/:id', updateWirelessForm);

module.exports = router;
