const express = require("express");
const router = express.Router();
const { Register, Login, Logout, refreshAccessToken, AdminLogin } = require("../../controller/auth/auth.controller");
router.post("/register", Register);
router.post("/login", Login);
router.post("/logout", Logout);
router.post("/super-admin", AdminLogin);
router.post("/refresh-token", refreshAccessToken);
module.exports = router;