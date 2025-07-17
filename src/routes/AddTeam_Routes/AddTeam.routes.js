const express = require("express");
const router = express.Router();

const AllstaffController = require("../../controllers/AddTeam_Controller/AddTeam_Controller");
const {
  isAuthenticated,
  isAdmin,
} = require("../../middlewares/authMiddleware");

//Get Admin Team Routes
router.get("/Allstaff", isAuthenticated, isAdmin, AllstaffController.Allstaff);

// Post Admin Team Routes
router.post("/AdminTeam", AllstaffController.AddTeam);

module.exports = router;
