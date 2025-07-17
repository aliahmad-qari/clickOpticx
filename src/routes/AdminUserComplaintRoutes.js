const express = require("express");
const router = express.Router();

const AdminUserComplaintController = require("../controllers/adminUsersComplaint");

//Get Admin User Complaint
router.get("/UserComplaint", AdminUserComplaintController.AllComplaints);

// Update Admin User Complaint
router.post(
  "/UserComplaint/update/:id",
  AdminUserComplaintController.UpdateAllComplaints
);

// Delete Admin User Complaint
router.delete(
  "/UserComplaint/:id",
  AdminUserComplaintController.DeleteComplaint
);

module.exports = router;
