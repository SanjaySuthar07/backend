const Store = require("../../models/Store.model");
const Seller = require("../../models/Seller.model");
const Customer = require("../../models/Customer.model");
const MilkDelivery = require("../../models/MilkDelivery.model");

const asyncHandler = require("../../utils/asyncHandle");

/* ==============================
   Helper: Month range
============================== */
const getMonthRange = (year, monthIndex) => {
  const start = new Date(year, monthIndex, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, monthIndex + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/* ==============================
   Helper: Day range
============================== */
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/* ==============================
   GET ALL STORES WITH PAGINATION + STATS
   GET /api/super-admin/stores/list?page=1&limit=10
============================== */
const getAllStoresWithStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const { start: todayStart, end: todayEnd } = getTodayRange();
  const { start: monthStart, end: monthEnd } = getMonthRange(
    now.getFullYear(),
    now.getMonth()
  );

  // ✅ pagination
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "10");
  const skip = (page - 1) * limit;

  // ✅ total store count
  const totalStores = await Store.countDocuments({});

  // ✅ fetch paginated stores
  const stores = await Store.find({})
    .select("shopName shopAddress isActive isSuspended userId createdAt")
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const storeIds = stores.map((s) => s._id);

  // If no stores in this page
  if (!stores || stores.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No stores found",
      data: [],
      pagination: {
        page,
        limit,
        totalStores,
        totalPages: Math.ceil(totalStores / limit),
        hasMore: false,
      },
    });
  }

  // ===========================
  // 1) Total Sellers per Store
  // ===========================
  const sellerCounts = await Seller.aggregate([
    { $match: { storeID: { $in: storeIds } } },
    { $group: { _id: "$storeID", total: { $sum: 1 } } },
  ]);

  // ===========================
  // 2) Total Customers per Store
  // ===========================
  const customerCounts = await Customer.aggregate([
    { $match: { storeID: { $in: storeIds } } },
    { $group: { _id: "$storeID", total: { $sum: 1 } } },
  ]);

  // ===========================
  // 3) Today Delivered per Store
  // ===========================
  const todayDelivered = await MilkDelivery.aggregate([
    {
      $match: {
        storeID: { $in: storeIds },
        status: "delivered",
        date: { $gte: todayStart, $lte: todayEnd },
      },
    },
    {
      $group: {
        _id: "$storeID",
        totalMilk: { $sum: "$milkQty" },
      },
    },
  ]);

  // ===========================
  // 4) Month Delivered per Store
  // ===========================
  const monthDelivered = await MilkDelivery.aggregate([
    {
      $match: {
        storeID: { $in: storeIds },
        status: "delivered",
        date: { $gte: monthStart, $lte: monthEnd },
      },
    },
    {
      $group: {
        _id: "$storeID",
        totalMilk: { $sum: "$milkQty" },
      },
    },
  ]);

  // Convert arrays into maps
  const sellerMap = new Map(sellerCounts.map((x) => [String(x._id), x.total]));
  const customerMap = new Map(
    customerCounts.map((x) => [String(x._id), x.total])
  );
  const todayMap = new Map(
    todayDelivered.map((x) => [String(x._id), x.totalMilk])
  );
  const monthMap = new Map(
    monthDelivered.map((x) => [String(x._id), x.totalMilk])
  );

  const final = stores.map((store) => {
    const storeId = String(store._id);

    return {
      _id: store._id,
      shopName: store.shopName,
      ownerName: store?.userId?.name || "-",
      city: "-",
      pincode: "-",
      sellers: sellerMap.get(storeId) || 0,
      customers: customerMap.get(storeId) || 0,
      todayDelivered: todayMap.get(storeId) || 0,
      monthDelivered: monthMap.get(storeId) || 0,
      isActive: store.isActive === true && store.isSuspended !== true,
    };
  });

  const totalPages = Math.ceil(totalStores / limit);

  return res.status(200).json({
    success: true,
    message: "Stores fetched successfully",
    data: final,
    pagination: {
      page,
      limit,
      totalStores,
      totalPages,
      hasMore: page < totalPages,
    },
  });
});

module.exports = {
  getAllStoresWithStats,
};
