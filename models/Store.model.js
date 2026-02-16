const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    shopName: {
      type: String,
      required: true,
      trim: true
    },
    shopAddress: {
      type: String,
      trim: true
    },
    contactNumber: {
      type: String,
      trim: true
    },
    milkTypes: [
      {
        type: String,
        enum: ["cow", "buffalo"]
      }
    ],
    defaultMilkRate: {
      type: Number,
      min: 0,
      default: 0
    },
    // Current active plan ki ID
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true
    },
    planExpiresAt: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isSuspended: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Store = mongoose.model("Store", storeSchema);
module.exports = Store;