const express = require("express");
const router = express.Router();

const ActiveUser = require("../../controllers/AddUser_Controller/ActiveUser_Controller");

router.get("/ActiveUser", ActiveUser.ActiveUser);

module.exports = router;