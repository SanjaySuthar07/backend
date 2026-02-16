const express = require("express");
const router = express.Router();

const {
    getAllStoresWithStats,
} = require("../../controller/common/publicStore.controller");

router.get("/list", getAllStoresWithStats);

module.exports = router;
