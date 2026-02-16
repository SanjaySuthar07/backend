const User = require("../models/User.model")
import otpGenerator from "otp-generator";
/* ===========================
   USER SERVICES
=========================== */
export const getAllUsers = async () => {
    return await User.find();
};

export const createUser = async (data) => {
    const user = new User({
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        password: data.password,
        role: data.role || "customer"
    });

    return await user.save();
};

/* ===========================
   TOKEN SERVICES
=========================== */
export const generateTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw error;
    }
};

/* ===========================
   OTP SERVICES
=========================== */
export const generateOtp = () => {
    return otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
    });
};

export const getOtpExpiry = () => {
    return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
};

/* ===========================
   save Otp User  SERVICES
=========================== */
export const saveOtpForUser = async (mobile, otp) => {
    const user = await User.findOne({ mobile });

    if (!user) throw new Error("User not found");

    user.otp = otp;
    user.otpExpiresAt = getOtpExpiry();

    await user.save({ validateBeforeSave: false });

    return true;
};

// check for is otp send or not 
export const sendOtpSms = async (mobile, otp) => {
    console.log(`📩 OTP sent to ${mobile}: ${otp}`);
};