const express = require("express");
const router = express.Router();

const AdminUserController = require("../controllers/AdminUserController");
const { isAuthenticated, isAdmin } = require("../middlewares/authMiddleware");

//Get Admin User Routes
router.get("/AdminUser", isAuthenticated, isAdmin, (req, res) => {
  const viewName = req.query.expiryStatus === "active"
    ? "AddUsers/ActiveUser"
    : "AddUsers/User";

  AdminUserController.AllUsers(req, res, viewName);
});


// Update Admin User Routes
router.post("/AdminUser/update/:id", AdminUserController.UpdateUser);

// Delete Admin User Routes
router.delete("/AdminUser/:id", AdminUserController.DeleteUser);
router.get("/ActiveUser", isAuthenticated, isAdmin, (req, res) => {
  req.query.expiryStatus = "active"; // Force active filter
  const controller = require("../controllers/AdminUserController");
  controller.AllUsers(req, res, "AddUsers/ActiveUser="); // Pass view name
});



module.exports = router;
