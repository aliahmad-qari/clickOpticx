const express = require("express");
const router = express.Router();

const AdminUserController = require("../controllers/AdminUserController");
const { isAuthenticated, isAdmin } = require("../middlewares/authMiddleware");

//Get Admin User Routes
router.get(
  "/AdminUser",
  isAuthenticated,
  isAdmin,
  AdminUserController.AllUsers
);

// Update Admin User Routes
router.post("/AdminUser/update/:id", AdminUserController.UpdateUser);

// Delete Admin User Routes
router.delete("/AdminUser/:id", AdminUserController.DeleteUser);

module.exports = router;
