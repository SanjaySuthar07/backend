const mongoose = require("mongoose")
const sellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    storeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true
    },

    // Seller can cover multiple areas
    assignedAreaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
      }
    ],

    isActive: {
      type: Boolean,
      default: true
    },
  },
  { timestamps: true }
);

const Seller = mongoose.model("Seller", sellerSchema)
module.exports = Seller