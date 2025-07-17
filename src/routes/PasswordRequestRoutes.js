const express = require("express");
const router = express.Router();
const {profile,deleteEntry} = require("../controllers/PasswordRequestController");

router.get("/passwordRequest", profile);

router.get('/delete/:id', deleteEntry);

module.exports = router;
