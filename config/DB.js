const mongoose = require("mongoose")
const connectDb = async () => {
    try {
        await mongoose.connect("mongodb+srv://sanjaysuthar123:dadu12gajjar@cluster0.gzkxn3i.mongodb.net/milk-managment")
    } catch (error) {
        console.log("server error ", error)
    }
}
module.exports = connectDb