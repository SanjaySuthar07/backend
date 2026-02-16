const mongoose = require("mongoose")

const milkDeliverySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true
    },

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

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    milkType: {
      type: String,
      enum: ["cow", "buffalo"],
      required: true
    },

    milkQty: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["delivered", "skipped", "missed"],
      default: "delivered"
    },

    isPausedDay: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

milkDeliverySchema.index(
  { customerId: 1, date: 1 },
  { unique: true }
);

const MilkDelivery = mongoose.model("MilkDelivery", milkDeliverySchema)
module.exports = MilkDelivery