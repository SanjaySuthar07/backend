const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    storeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    roleRequested: {
      type: String,
      enum: ["seller", "customer"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    message: {
      type: String,
      trim: true,
    },

    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

joinRequestSchema.index(
  { requesterId: 1, storeID: 1, roleRequested: 1 },
  { unique: true }
);

const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);
module.exports = JoinRequest;
