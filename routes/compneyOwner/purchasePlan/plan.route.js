const express = require("express");
const router = express.Router();
const { createRazorpayOrder, verifyAndActivateStore } = require("../../../controller/compneyOwner/getPlan/store.controller");
const verifyJWT = require("../../../middleware/auth.middleware");

router.post("/create-order", verifyJWT, createRazorpayOrder);
router.post("/verify-payment", verifyJWT, verifyAndActivateStore);
module.exports = router;