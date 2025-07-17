const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/uploadMiddleware");

const PromotionsAdd = require("../../controllers/Promotions_Controller/Promotions_Controller");

router.get("/Promotions", PromotionsAdd.Promotions);

router.post(
  "/Promotions",
  upload.single("img1"),
  PromotionsAdd.InsertPromotions
);

module.exports = router;
