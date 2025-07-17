const express = require("express");
const router = express.Router();
const { Slider_imgs,getPayments,deletePayment} = require("../controllers/paymentshistroyController");


router.get("/paymentshistory", Slider_imgs);
router.get('/api/payments', getPayments);
router.post('/delete-payment/:id',deletePayment);
module.exports = router;
