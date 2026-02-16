const mongoose = require("mongoose")
const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
    } catch (error) {
        console.log("server error ", error)
    }
}
module.exports = connectDb