const express = require("express");
const router = express.Router();

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

const { createSeller, getAllSellers, updateSeller, deleteSeller, } = require("../../../controller/compneyOwner/seller/seller.controller");

// OWNER ONLY
router.post("/", verifyJWT, authorizeRoles("owner"), createSeller);
router.get("/", verifyJWT, authorizeRoles("owner"), getAllSellers);
router.put("/:id", verifyJWT, authorizeRoles("owner"), updateSeller);
router.delete("/:id", verifyJWT, authorizeRoles("owner"), deleteSeller);

module.exports = router;
