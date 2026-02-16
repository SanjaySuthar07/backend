const express = require("express");
const router = express.Router();
router.use("/profile", require("./profile/profile.route"));
router.use("/milk-delivered", require("./deliveredMilk/deliveredMilk.route"));
router.use("/milk-assign", require("./milkAssign/milkAssign.route"));
router.use("/payment", require("./payment/sellerPayment.routes"));
module.exports = router