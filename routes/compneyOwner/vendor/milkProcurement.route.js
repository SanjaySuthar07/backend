const express = require("express");
const router = express.Router();

const { createMilkProcurement, getVendorMilkProcurements, getAllMilkProcurements, updateMilkProcurement, deleteMilkProcurement } = require("../../../controller/compneyOwner/milkProcurement/milkProcurement.controller");
const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

router.post("/", verifyJWT, authorizeRoles("owner"), createMilkProcurement);
router.get("/", verifyJWT, authorizeRoles("owner"), getAllMilkProcurements);
router.put("/:id", verifyJWT, authorizeRoles("owner"), updateMilkProcurement);
router.delete("/:id", verifyJWT, authorizeRoles("owner"), deleteMilkProcurement);
router.get(
    "/vendor/:vendorId",
    verifyJWT,
    authorizeRoles("owner"),
    getVendorMilkProcurements);

module.exports = router;