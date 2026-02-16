const express = require("express");
const router = express.Router();
const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");
const {
  getTodayMilkAssignForSeller,
  getTodaySellerDashboardSummary,
  getMilkAssignByDateForSeller,
} = require("../../../controller/seller/milkAssign.controller");
router.get("/today", verifyJWT, authorizeRoles("seller"), getTodayMilkAssignForSeller);
router.get("/date/:date", verifyJWT, authorizeRoles("seller"), getMilkAssignByDateForSeller);
router.get("/today-summary", verifyJWT, authorizeRoles("seller"), getTodaySellerDashboardSummary);
module.exports = router;