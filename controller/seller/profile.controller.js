const User = require("../../models/User.model");
const Seller = require("../../models/Seller.model");
const Store = require("../../models/Store.model");
const Address = require("../../models/Address.model");
const Stock = require("../../models/Stock");

const ApiError = require("../../utils/apiError");
const asyncHandler = require("../../utils/asyncHandle");
const { normalizeDate } = require("../../utils/stockHelper");

/* =========================
   SELLER PROFILE (FULL)
========================= */
const getSellerProfile = asyncHandler(async (req, res) => {
  // 1) Logged in user (ONLY SAFE FIELDS)
  const user = await User.findById(req.user._id).select(
    "name email mobile profileImage role"
  );

  if (!user) throw new ApiError(404, "User not found");

  // 2) Seller (with areas)
  const seller = await Seller.findOne({ userId: user._id, isActive: true })
    .select("storeID assignedAreaIds isActive")
    .populate("assignedAreaIds", "areaName city pincode");

  if (!seller) throw new ApiError(404, "Seller not found");

  // 3) Store (ONLY BASIC SAFE FIELDS)
  const store = await Store.findById(seller.storeID).select(
    "shopName shopAddress contactNumber milkTypes defaultMilkRate"
  );

  if (!store) throw new ApiError(404, "Store not found");

  // 4) Today summary (from Stock)
  const today = normalizeDate(new Date());

  const stockList = await Stock.find({
    storeID: store._id,
    date: today,
  }).select("milkType sellerTotalAssign sellerSoldQty sellerRemainingMilk");

  let totalAssign = 0;
  let sold = 0;
  let remaining = 0;

  const milkTypeSummary = {};

  stockList.forEach((s) => {
    const assignQty = Number(s.sellerTotalAssign || 0);
    const soldQty = Number(s.sellerSoldQty || 0);
    const remainingQty = Number(s.sellerRemainingMilk || 0);

    totalAssign += assignQty;
    sold += soldQty;
    remaining += remainingQty;

    milkTypeSummary[s.milkType] = {
      totalAssign: assignQty,
      sold: soldQty,
      remaining: remainingQty,
    };
  });

  return res.status(200).json({
    success: true,
    message: "Seller profile fetched successfully",
    data: {
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      },

      store: {
        _id: store._id,
        shopName: store.shopName,
        shopAddress: store.shopAddress,
        contactNumber: store.contactNumber,
        milkTypes: store.milkTypes,
        defaultMilkRate: store.defaultMilkRate,
      },

      seller: {
        _id: seller._id,
        isActive: seller.isActive,
        assignedAreaIds: seller.assignedAreaIds,
      },

      todaySummary: {
        date: today,
        totalAssign,
        sold,
        remaining,
        milkTypeSummary,
      },
    },
  });
});

module.exports = {
  getSellerProfile,
};
