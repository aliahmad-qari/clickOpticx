const express = require("express");
const router = express.Router();
const { uploadPromotion } = require("../../config/cloudinary");

const PromotionsAdd = require("../../controllers/Promotions_Controller/Promotions_Controller");

router.get("/Promotions", PromotionsAdd.Promotions);

// Use high-quality upload for promotions
router.post(
  "/Promotions",
  uploadPromotion.single("img1"),
  PromotionsAdd.InsertPromotions
);
// ⛔ MISSING - Add this!
router.post("/Promotions/delete/:id", PromotionsAdd.DeletePromotion);

module.exports = router;
