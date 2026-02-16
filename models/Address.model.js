const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    storeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true
    },

    areaName: {
      type: String,
      required: true,
      trim: true
    },

    city: {
      type: String,
      trim: true
    },

    pincode: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", addressSchema)
module.exports = Address