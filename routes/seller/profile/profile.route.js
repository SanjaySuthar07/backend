const express = require("express");
const router = express.Router();
const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");
const {
    getSellerProfile,
} = require("../../../controller/seller/profile.controller");
router.get("/", verifyJWT, authorizeRoles("seller"), getSellerProfile);
module.exports = router;
