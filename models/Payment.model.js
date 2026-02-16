const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema(
  {
    storeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank", "online"],
      required: true
    },

    // NEW (important)
    gateway: {
      type: String,
      enum: ["razorpay", "cash", "upi", "bank"],
      required: true
    },

    // Razorpay fields (only filled if gateway=razorpay)
    razorpayOrderId: {
      type: String
    },

    razorpayPaymentId: {
      type: String
    },

    razorpaySignature: {
      type: String
    },

    gatewayStatus: {
      type: String,
      enum: ["created", "authorized", "captured", "failed"],
      default: "created"
    },
    collectedBySellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      index: true
    },

    paymentDate: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);


const Payment = mongoose.model("Payment", paymentSchema)
module.exports = Payment