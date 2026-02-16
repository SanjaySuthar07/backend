const express = require("express");
const router = express.Router();

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

const {
    getCustomerThisMonthDeliveryHistory,
    getCustomerPreviousMonthDeliveryHistory,
} = require("../../../controller/customer/customerDeliveryHistory.controller");

// ✅ this month history
router.get("/this-month", verifyJWT, authorizeRoles("customer"), getCustomerThisMonthDeliveryHistory);

// ✅ previous month history
router.get("/previous-month", verifyJWT, authorizeRoles("customer"), getCustomerPreviousMonthDeliveryHistory);

module.exports = router;