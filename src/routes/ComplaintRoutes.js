const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const {
  AllComplaint,
  uploadTaskImages,
} = require("../controllers/ComplaintController");

// get the complaint of the user
router.get("/complaint", AllComplaint);

router.post('/upload-task', upload.single('images'), uploadTaskImages);


module.exports = router;
