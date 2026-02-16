const User = require("../../models/User.model");
const ApiResponse = require("../../utils/apiResponse");
const ApiError = require("../../utils/apiError");
const asyncHandler = require("../../utils/asyncHandle");
// ================= REGISTER =================
const Register = asyncHandler(async (req, res) => {
    const { name, mobile, password, address } = req.body;

    if (!name || !mobile || !password || !address) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
        throw new ApiError(409, "Mobile number already registered");
    }

    const user = await User.create({
        name,
        mobile,
        password,
        address
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                user: {
                    _id: user._id,
                    name: user.name,
                    mobile: user.mobile,
                    role: user.role,
                    isMobileVerified: user.isMobileVerified
                },
            },
            "User registered successfully"
        )
    );
});

// ================= LOGIN =================
const Login = asyncHandler(async (req, res) => {
    const { mobile, password } = req.body;

    // 1️⃣ Validate input
    if (!mobile || !password) {
        throw new ApiError(400, "Mobile and password are required");
    }

    // 2️⃣ Find user
    const user = await User.findOne({ mobile }).select("+password");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // 3️⃣ Account status
    if (!user.isActive || user.isBlocked) {
        throw new ApiError(403, "Account is disabled or blocked");
    }

    // 4️⃣ Password check
    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid mobile or password");
    }

    // 5️⃣ Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // 6️⃣ Save refresh token
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // 7️⃣ Cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };

    // 8️⃣ Response (JSON)
    return res
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .status(200)
        .json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    mobile: user.mobile,
                    role: user.role
                }
            },
            accessToken,
            refreshToken
        });
});

const AdminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Mobile and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isActive || user.isBlocked) {
    throw new ApiError(403, "Account is disabled or blocked");
  }

  // ✅ SUPER ADMIN ONLY
  if (user.role !== "super_admin") {
    throw new ApiError(403, "Only Super Admin can login here");
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid mobile or password");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };

  return res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .status(200)
    .json({
      success: true,
      message: "Super Admin Login successful",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          mobile: user.mobile,
          role: user.role
        }
      },
      accessToken,
      refreshToken
    });
});

// ================= LOGOUT =================
const Logout = asyncHandler(async (req, res) => {
    // 1️⃣ refreshToken kaha se aaya?
    const refreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
        throw new ApiError(400, "Refresh token required");
    }

    // 2️⃣ DB se refreshToken remove
    await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
    );

    // 3️⃣ Web ke liye cookies clear
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // 4️⃣ JSON response
    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});


// ================= REFRESH TOKEN =================
const refreshAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies || req.body;

    if (!refreshToken) {
        throw new ApiError(401, "Refresh token missing");
    }

    // verify refresh token
    let decoded;
    try {
        decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (err) {
        throw new ApiError(403, "Invalid refresh token");
    }

    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== refreshToken) {
        throw new ApiError(403, "Refresh token not valid");
    }

    // generate new access token
    const newAccessToken = user.generateAccessToken();

    return res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        message: "Access token refreshed"
    });
});

module.exports = {
    Register,
    AdminLogin,
    Login,
    Logout,
    refreshAccessToken,
}