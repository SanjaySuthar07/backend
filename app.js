const express = require("express")
require("dotenv").config()
const cors = require("cors")
const cookiePars = require("cookie-parser");

// routes 
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookiePars())
//  route main apis
app.use("/api", require("./routes/main.route"));
// ----------------------------------
// common response handle
// ----------------------------------
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});
module.exports = app