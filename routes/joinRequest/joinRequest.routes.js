const express = require("express");
const router = express.Router();

const verifyJWT = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");

const {
  createJoinRequest,
  getMyJoinRequests,
  getOwnerJoinRequests,
  processJoinRequest,
} = require("../../controller/joinRequest/joinRequest.controller");

// ==========================
// USER APIs
// ==========================

// ✅ Create join request (user must be logged in)
router.post("/", verifyJWT, authorizeRoles("user"), createJoinRequest);

// ✅ User can see his requests
router.get("/my", verifyJWT, getMyJoinRequests);

// ==========================
// OWNER APIs
// ==========================

// ✅ Owner can see all requests for his store
router.get(
  "/owner",
  verifyJWT,
  authorizeRoles("owner"),
  getOwnerJoinRequests
);

// ✅ Owner approve / reject
router.patch(
  "/:id",
  verifyJWT,
  authorizeRoles("owner"),
  processJoinRequest
);

module.exports = router;
