const express = require("express");
const router = express.Router();

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

const {
    createCustomer,
    getAllCustomers,
    updateCustomer,
    deleteCustomer,
} = require("../../../controller/compneyOwner/customer/customer.controller");

// OWNER ONLY
router.post("/", verifyJWT, authorizeRoles("owner"), createCustomer);
router.get("/", verifyJWT, authorizeRoles("owner"), getAllCustomers);
router.put("/:id", verifyJWT, authorizeRoles("owner"), updateCustomer);
router.delete("/:id", verifyJWT, authorizeRoles("owner"), deleteCustomer);

module.exports = router;
