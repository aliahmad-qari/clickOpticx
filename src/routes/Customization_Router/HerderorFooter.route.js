const express = require("express");
const route = express.Router();

const HeaderFooters = require("../../controllers/Customization_Controller/HerderFooter.Controller");

route.get("/HeaderFooter", HeaderFooters.HeaderFooter);

route.delete("/icon_slider/:id", HeaderFooters.DeleteIcon);

module.exports = route;
