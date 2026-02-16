const express = require("express");
const router = express.Router();
router.use("/subscription", require("./subscription.route"));
router.use("/store", require("./store.route"));
module.exports = router;
