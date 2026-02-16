const express = require("express");
const router = express.Router();

router.use("/profile", require("./profile/customer.routes"));
router.use("/history", require("./history/customerDeliveryHistory.routes"));
router.use("/invoice", require("./invoice/customerInvoice.routes"));
router.use("/payment", require("./payment/customerPayment.routes"));
module.exports = router;