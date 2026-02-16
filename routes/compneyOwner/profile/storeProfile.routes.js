const express = require("express");
const router = express.Router();

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

const {
  getStoreProfile,
  updateStoreProfile,
} = require("../../../controller/compneyOwner/profile/storeProfile.controller");

// ✅ Get store + owner profile
router.get("/", verifyJWT, authorizeRoles("owner"), getStoreProfile);

// ✅ Update store + owner profile
router.put("/", verifyJWT, authorizeRoles("owner"), updateStoreProfile);

module.exports = router;
