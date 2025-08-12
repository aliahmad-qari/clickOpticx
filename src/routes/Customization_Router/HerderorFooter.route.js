const express = require("express");
const route = express.Router();
const { isAuthenticated, isAdmin } = require("../../middlewares/authMiddleware");

const HeaderFooters = require("../../controllers/Customization_Controller/HerderFooter.Controller");

route.get("/HeaderFooter", isAuthenticated, HeaderFooters.HeaderFooter);
route.delete("/icon_slider/:id", isAuthenticated, isAdmin, HeaderFooters.DeleteIcon);

// Correct usage
route.get("/NavbarSetting", isAuthenticated, HeaderFooters.NavbarSetting);
route.get("/FooterSetting", isAuthenticated, HeaderFooters.FooterSetting);

module.exports = route;
