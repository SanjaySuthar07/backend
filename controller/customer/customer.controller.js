const Customer = require("../../models/Customer.model");
const User = require("../../models/User.model");
const MilkDelivery = require("../../models/MilkDelivery.model");

const ApiError = require("../../utils/apiError");
const asyncHandler = require("../../utils/asyncHandle");
const { normalizeDate } = require("../../utils/stockHelper");

/* ==============================
   CUSTOMER GET PROFILE + TODAY MILK
============================== */
const getCustomerProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  // 1) customer find
  const customer = await Customer.findOne({ userId, isActive: true })
    .populate("storeID", "shopName shopAddress contactNumber")
    .populate("addressId", "areaName city pincode");

  if (!customer) {  
    throw new ApiError(404, "Customer profile not found");
  }

  // 2) user info
  const user = await User.findById(userId).select(
    "name mobile email address role profileImage isMobileVerified"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 3) Today milk (date range safe)
  const today = normalizeDate(new Date());

  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const todayDelivery = await MilkDelivery.findOne({
    customerId: customer._id,
    date: { $gte: start, $lte: end },
  }).select("milkQty status milkType date");

  return res.status(200).json({
    success: true,
    message: "Customer profile fetched successfully",
    data: {
      user,
      customer,
      todayMilk: {
        date: today,
        milkQty: todayDelivery ? Number(todayDelivery.milkQty || 0) : 0,
        status: todayDelivery ? todayDelivery.status : "not_delivered",
        milkType: todayDelivery ? todayDelivery.milkType : customer.milkType,
      },
    },
  });
});

/* ==============================
   CUSTOMER UPDATE PROFILE
============================== */

module.exports = {
  getCustomerProfile,
};
