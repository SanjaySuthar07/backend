const express = require("express");
const router = express.Router();
const { createAddress, getAllAddresses, updateAddress, deleteAddress } = require("../../../controller/compneyOwner/address/address.controller");

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");
// router.get("/", verifyJWT, getAllAddresses);
router.get("/", verifyJWT, authorizeRoles("owner"), getAllAddresses);
router.post("/", verifyJWT, authorizeRoles("owner"), createAddress);
router.put("/:id", verifyJWT, authorizeRoles("owner"), updateAddress);
router.delete("/:id", verifyJWT, authorizeRoles("owner"), deleteAddress);

module.exports = router;