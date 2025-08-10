const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const { profile,task,getTasks,deleteTask } = require("../controllers/addtaskController");

router.get("/addtask", profile);

router.post("/add-task", upload.single("image"), task);

router.get('/tasks', getTasks);


router.post('/delete-task/:id', deleteTask);

module.exports = router;