const express = require("express");
const router = express.Router();

const AddUser = require("../../controllers/AddUser_Controller/AddUser_Controller");

// Post Admin User Routes
router.get("/AddUser", AddUser.AddUser);

router.post("/AdminUser", AddUser.AllUser);
// Post Admin User Routes

module.exports = router;
