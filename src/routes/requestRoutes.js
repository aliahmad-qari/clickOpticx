const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middlewares/authMiddleware");

const {
  profile,
  updatePlan,       // ✅ the CORRECT one
  DeleteUser,
  getPayments,
  sendRespit
} = require("../controllers/requestController");

// GET user request page  
router.get("/request", isAuthenticated, getPayments);

// ✅ Use the correct controller for admin update form
router.post("/update-plan", isAuthenticated, isAdmin, updatePlan);

// (Optional) If you also want a separate user update route
// router.post("/user-update-plan", updatePlan);

router.delete("/request/:id", isAuthenticated, isAdmin, DeleteUser);
router.get("/payments", isAuthenticated, getPayments);
router.post("/send-respit", isAuthenticated, isAdmin, sendRespit);

module.exports = router;
