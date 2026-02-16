const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      // required: true,
      // unique: true,
      trim: true
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    otp: {
      type: String
    },

    otpExpiresAt: {
      type: Date
    },

    isMobileVerified: {
      type: Boolean,
      default: false
    },

    password: {
      type: String,
      select: false
    },
    address: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "owner", "seller", "customer", "user"],
      default: "user",
      required: true
    },

    refreshToken: {
      type: String
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isBlocked: {
      type: Boolean,
      default: false
    },

    profileImage: {
      type: String,
      default: ""
    },

    lastLoginAt: {
      type: Date
    }
  },
  { timestamps: true }
);

/// 🔐 Password hash
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/// 🔑 Password check
userSchema.methods.isPasswordCorrect = async function (password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

/// 🔑 Access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

/// 🔁 Refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

const User = mongoose.model("User", userSchema)
module.exports = User