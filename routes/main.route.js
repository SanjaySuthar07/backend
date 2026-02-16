const express = require("express")
const router = express.Router()
// Auth   main  router 
router.use("/auth", require("./auth/auth.route"));
// supper-admin main  router 
router.use("/super-admin", require("./supperAdmin/index.route"));
// supper-admin main  router
router.use("/store", require("./compneyOwner/index.route"));
// supper-admin main  router
router.use("/seller", require("./seller/index.route"));
// Customer  main  router
router.use("/customer", require("./customer/index.route"));

// public route 
router.use("/user", require("./common/publicStore.routes"));
router.use("/join-request", require("./joinRequest/joinRequest.routes"));
module.exports = router;