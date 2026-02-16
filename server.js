require("dotenv").config();
const app = require("./app")
const connectDb = require("./config/DB")

connectDb()
const PORT =  3000

app.listen(PORT, () => {
  console.log("server Start ", PORT)
})