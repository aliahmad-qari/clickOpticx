const express = require("express");
const router = express.Router();

const {
  profile,
  updatePlan,       // ✅ the CORRECT one
  DeleteUser,
  getPayments,
  sendRespit
} = require("../controllers/requestController");

// GET user request page  
router.get("/request", getPayments);

// ✅ Use the correct controller for admin update form
router.post("/update-plan", updatePlan);

// (Optional) If you also want a separate user update route
// router.post("/user-update-plan", updatePlan);

router.delete("/request/:id", DeleteUser);
router.get("/payments", getPayments);
router.post("/send-respit", sendRespit);

module.exports = router;
