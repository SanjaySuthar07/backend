const mongoose = require("mongoose")
const milkAssignSchema = new mongoose.Schema(
    {
        storeID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
            index: true
        },

        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true,
            index: true
        },

        date: {
            type: Date,
            required: true,
            index: true
        },

        milkType: {
            type: String,
            enum: ["cow", "buffalo"],
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 0
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

/**
 * One seller → one milkType → one day → one record
 */
milkAssignSchema.index(
    { storeID: 1, sellerId: 1, milkType: 1, date: 1 },
    { unique: true }
);


const MilkAssign = mongoose.model("MilkAssign", milkAssignSchema)
module.exports = MilkAssign

