const express = require("express");
const router = express.Router();
const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");
const {
  getStoreTodayPayments,
} = require("../../../controller/compneyOwner/seller/storePayment.controller");
router.get("/today", verifyJWT, authorizeRoles("owner"), getStoreTodayPayments);
module.exports = router;
