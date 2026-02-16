const mongoose = require("mongoose")


const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true
    },

    storeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    periodStart: {
      type: Date,
      required: true
    },

    periodEnd: {
      type: Date,
      required: true
    },

    totalMilkQty: {
      type: Number,
      required: true,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid"
    },

    isDownloaded: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);




const Invoice = mongoose.model("Invoice", invoiceSchema)
module.exports = Invoice