const express = require("express");
const router = express.Router();

const verifyJWT = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");

const {
  getStoreListForTable,
  getStoreDetailsById,
  updateStoreActiveStatus,
  updateStoreSuspendStatus,
} = require("../../controller/supperAdmin/store.controller");

router.use(verifyJWT, authorizeRoles("super_admin"));

// ✅ Table list
router.get("/", getStoreListForTable);

// ✅ View modal detail
router.get("/:id", getStoreDetailsById);

// ✅ Approve / Reject
router.patch("/:id/active", updateStoreActiveStatus);

// ✅ Suspend / Unsuspend
router.patch("/:id/suspend", updateStoreSuspendStatus);

module.exports = router;
