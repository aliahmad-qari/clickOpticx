const express = require("express");
const router = express.Router();

const AdminTeamController = require("../controllers/AdminTeamController");
const { isAuthenticated, isAdmin } = require("../middlewares/authMiddleware");

//Get Admin Team Routes
router.get(
  "/AdminTeam",
  isAuthenticated,
  isAdmin,
  AdminTeamController.AllTeams
);

// Update Admin Team Routes
router.post("/AdminTeam/update/:id", AdminTeamController.UpdateTeam);

// Delete Admin User Routes
router.delete("/AdminTeam/:id", AdminTeamController.DeleteTeam);

module.exports = router;
