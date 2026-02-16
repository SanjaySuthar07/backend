const mongoose = require("mongoose");


const subscriptionHistorySchema = new mongoose.Schema(
    {
        storeID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
            index: true
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubscriptionPlan",
            required: true
        },
        amountPaid: {
            type: Number,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "pending"
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        razorpayPaymentId: String,
        razorpayOrderId: String,

        planSnapshot: {
            name: String,
            maxCustomers: Number,
            maxSellers: Number
        }
    },
    { timestamps: true }
);

const SubscriptionHistory = mongoose.model("SubscriptionHistory", subscriptionHistorySchema)
module.exports = SubscriptionHistory