const express = require("express");
const router = express.Router();

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

const {
  createMilkDelivery,
  getSellerCustomers
} = require("../../../controller/seller/milkDelivery.controller");

router.get("/customer", verifyJWT, authorizeRoles("seller"), getSellerCustomers);
// SELLER ONLY
router.post("/", verifyJWT, authorizeRoles("seller"), createMilkDelivery);

module.exports = router;
