const express = require("express");
const router = express.Router();
router.use("/plan", require('./purchasePlan/plan.route'))
router.use("/vendor", require('./vendor/vendor.route'))
router.use("/vendor/milkProcurement", require('./vendor/milkProcurement.route'))
router.use("/address", require('./address/address.route'))
router.use("/seller", require('./seller/seller.route'))
router.use("/customer", require('./customer/customer.route'))
router.use("/milk-procurement", require('./vendor/milkProcurement.route'));
router.use("/milk-assign", require("./seller/milkAssign.routes"));
router.use("/payment", require("./seller/storePayment.routes"));
router.use("/profile", require("./profile/storeProfile.routes"));
router.use("/stock", require("./stock/stock.route"));
module.exports = router