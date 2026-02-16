const express = require("express");
const router = express.Router();

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

const {
  getCustomerPaymentHistory,
} = require("../../../controller/customer/customerPayment.controller");

router.get("/history", verifyJWT, authorizeRoles("customer"), getCustomerPaymentHistory);

module.exports = router;
