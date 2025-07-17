const express = require("express");
const router = express.Router();

const ExpiredUser = require("../../controllers/AddUser_Controller/ExpiredUser_Controller");

router.get("/ExpiredUser", ExpiredUser.ExpiredUser);

module.exports = router;
