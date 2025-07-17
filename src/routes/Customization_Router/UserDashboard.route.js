const express = require("express");
const router = express.Router();

const Coustomization = require("../../controllers/Customization_Controller/UserDashboard.Controller");

router.get("/UserDashboard", Coustomization.Coustomizations);

module.exports = router;
