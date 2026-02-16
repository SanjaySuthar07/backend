const express = require("express");
const router = express.Router();
const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");
const { getCustomerProfile } = require("../../../controller/customer/customer.controller");

router.get("/", verifyJWT, authorizeRoles("customer"), getCustomerProfile);

module.exports = router;
