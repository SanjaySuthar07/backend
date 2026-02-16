const express = require("express");
const router = express.Router();

const verifyJWT = require("../../../middleware/auth.middleware");
const authorizeRoles = require("../../../middleware/role.middleware");

const {
  getTodayStock,
} = require("../../../controller/compneyOwner/stock/stock.controller");

router.get(
  "/today",
  verifyJWT,
  authorizeRoles("owner"),
  getTodayStock
);

module.exports = router;
