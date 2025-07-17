const express = require("express");
const route = express.Router();

const BrandLogos = require("../../controllers/Customization_Controller/BrandingPage.Controller");

route.get("/BrandingPage", BrandLogos.Brandinglogo);

route.delete("/Slider_img/:id", BrandLogos.DeleteSlider);

module.exports = route;
