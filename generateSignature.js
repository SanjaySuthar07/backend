const crypto = require("crypto");

const orderId = "order_S9aKvQY4NPhaYW";
const paymentId = "pay_test_123";
const secret = "oICN0DhGn2sn5wg4e9inbwaE";
const signature = crypto
    .createHmac("sha256", secret)
    .update(orderId + "|" + paymentId)
    .digest("hex");

console.log("SIGNATURE 👉", signature);
