const express = require("express");
const router = express.Router();
const { createVendor, getAllVendors, updateVendor, deleteVendor } = require("../../../controller/compneyOwner/vendor/vendore.controller");
const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");
router.post("/", verifyJWT, authorizeRoles("owner"), createVendor);
router.get("/", verifyJWT, authorizeRoles("owner"), getAllVendors);
router.put("/:id", verifyJWT, authorizeRoles("owner"), updateVendor);
router.delete("/:id", verifyJWT, authorizeRoles("owner"), deleteVendor);

module.exports = router;