const express = require("express");
const router = express.Router();

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

const {
  sellerCreateManualPayment,
  getSellerTodayCollections,
} = require("../../../controller/seller/sellerPayment.controller");

router.post("/", verifyJWT, authorizeRoles("seller"), sellerCreateManualPayment);

router.get("/today", verifyJWT, authorizeRoles("seller"), getSellerTodayCollections);

module.exports = router;
