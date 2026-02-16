const express = require("express");
const router = express.Router();

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

const {
    createMilkAssign,
    getAllMilkAssigns,
    getMilkAssignsBySellerHistory,
    updateMilkAssign,
    deleteMilkAssign,
    getSellerTodaySummary
} = require("../../../controller/compneyOwner/seller/assingMilk.controller");

// OWNER ONLY
router.post("/", verifyJWT, authorizeRoles("owner"), createMilkAssign);
router.get("/", verifyJWT, authorizeRoles("owner"), getAllMilkAssigns);
router.put("/:id", verifyJWT, authorizeRoles("owner"), updateMilkAssign);
router.delete("/:id", verifyJWT, authorizeRoles("owner"), deleteMilkAssign);
router.get("/seller/:sellerId", verifyJWT, authorizeRoles("owner"), getMilkAssignsBySellerHistory);

router.get(
    "/seller-summary/:sellerId",
    verifyJWT,
    authorizeRoles("owner"),
    getSellerTodaySummary
);

module.exports = router;
