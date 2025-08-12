const express = require("express");
const router = express.Router();
const indexController = require("../controllers/indexController");
const { upload, uploadLogo } = require("../config/cloudinary");
const { isAuthenticated, isAdmin } = require("../middlewares/authMiddleware");

router.get("/index", isAuthenticated, indexController.plan);

// Upload Nav_img picture (Admin only) - Use high-quality logo upload
router.post("/index", isAuthenticated, isAdmin, uploadLogo.single("navImg"), indexController.updateNav_img);
// Upload Nav_img picture

router.post("/process-payment", indexController.updateSubscription);
// Upload background Image// Upload background Image// Upload background Image
router.post(
  "/upload",
  upload.single("background_img"),
  indexController.uploadBackgroundImage
);
// Upload background Image// Upload background Image

router.post("/textChange", indexController.updateText);

// Icon Change Slider// Icon Change Slider// Icon Change Slider
router.post("/updateIcon", upload.single("Icon"), indexController.updateIcon);
// Icon Change Slider// Icon Change Slider// Icon Change Slider

// ssssssssssssssss
router.post("/delete-background", indexController.deleteBackgroundImage);
router.post("/reset-background-color", indexController.resetBackgroundColor);
router.post("/reset-text-color", indexController.resetTextColor);
router.post("/reset-logo", indexController.resetLogo);
router.post("/delete-all-sliders", indexController.deleteAllSliders);
router.post("/delete-all-icons", indexController.deleteAllIcons);

router.post("/logoTextChange", indexController.updateLogoText);

// router.post("/updateIcon", indexController.updatebackgroundcolor);
router.post("/update-background-color", indexController.updatebackgroundcolor);
// color change
router.post("/textChange", indexController.updateText);

router.post("/mark-one", indexController.NewNoti);

module.exports = router;
