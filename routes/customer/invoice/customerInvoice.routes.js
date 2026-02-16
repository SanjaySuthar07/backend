const express = require("express");
const router = express.Router();

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

const {
  getCustomerThisMonthInvoice,
  getCustomerPreviousMonthInvoice,
} = require("../../../controller/customer/customerInvoice.controller");

router.get("/this-month", verifyJWT, authorizeRoles("customer"), getCustomerThisMonthInvoice);

router.get("/previous-month", verifyJWT, authorizeRoles("customer"), getCustomerPreviousMonthInvoice);

module.exports = router;
