const express = require("express");
const router = express.Router();

const SliderController = require("../controllers/SliderController");
const upload = require("../middlewares/uploadMiddleware");

// ssss
router.get("/Slider_img", SliderController.Slider_imgs);

router.post(
  "/Slider_img",
  upload.fields([{ name: "Slider_1" }, { name: "Slider_2" }]),
  SliderController.Slider_img
);

router.delete("/Slider_img/:id", SliderController.DeleteSlider);

module.exports = router;
