const mongoose = require("mongoose");

const subscriptionPlan = new mongoose.Schema(
  {
    // Plan name (Basic, Pro, Enterprise)
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Max customers admin can register
    maxCustomers: {
      type: Number,
      required: true,
      min: 0
    },

    // Max sellers admin can register
    maxSellers: {
      type: Number,
      required: true,
      min: 0
    },

    // Plan price
    price: {
      type: Number,
      required: true,
      min: 0
    },

    // Monthly / Yearly / Trial
    planType: {
      type: String,
      enum: ["monthly", "yearly", "trial"],
      required: true
    },

    // Duration in days (30, 365, 7 etc.)
    duration: {
      type: Number,
      required: true
    },

    // Feature list (string array)
    features: [
      {
        type: String,
        trim: true
      }
    ],
    // Plan active / inactive
    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlan);
module.exports = SubscriptionPlan