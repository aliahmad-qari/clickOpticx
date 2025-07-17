const express = require("express");
const router = express.Router();
const { Slider_imgs} = require("../controllers/pandingpaymentsController");


router.get("/pandingpayments", Slider_imgs);
module.exports = router;
