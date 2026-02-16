const Store = require("../../models/Store.model");
const SubscriptionHistory = require("../../models/SubscriptionHistory");

const ApiError = require("../../utils/apiError");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandle");

/* ===================================================
   1) STORE LIST (TABLE)
   GET /api/super-admin/store
=================================================== */
const getStoreListForTable = asyncHandler(async (req, res) => {
  const stores = await Store.find()
    .populate("userId", "name mobile email")
    .populate("planId", "name price")
    .select("shopName userId planId isActive isSuspended planExpiresAt createdAt")
    .sort({ createdAt: -1 });

  // 🔥 convert into your table format
  const tableData = stores.map((s) => {
    let status = "pending";

    // approved
    if (s.isActive === true) status = "approved";

    // rejected
    if (s.isActive === false) status = "rejected";

    // suspended (optional)
    if (s.isSuspended === true) status = "suspended";

    return {
      _id: s._id,
      shopName: s.shopName,
      owner: s?.userId?.name || "-",
      plan: s?.planId?.name || "-",
      amount: s?.planId?.price || 0,
      status,
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tableData, "Stores fetched"));
});

/* ===================================================
   2) STORE DETAIL (VIEW MODAL)
   GET /api/super-admin/store/:id
=================================================== */
const getStoreDetailsById = asyncHandler(async (req, res) => {
  const storeId = req.params.id;

  const store = await Store.findById(storeId)
    .populate("userId", "name mobile email role isActive isBlocked lastLoginAt createdAt")
    .populate("planId", "name price planType duration maxCustomers maxSellers features isActive")
    .select("-__v");

  if (!store) throw new ApiError(404, "Store not found");

  // plan history
  const planHistory = await SubscriptionHistory.find({ storeID: store._id })
    .populate("planId", "name price planType duration maxCustomers maxSellers")
    .select("amountPaid paymentStatus startDate endDate planSnapshot razorpayPaymentId razorpayOrderId createdAt")
    .sort({ createdAt: -1 });

  // days left
  const now = new Date();
  const daysLeft = Math.ceil(
    (new Date(store.planExpiresAt).getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        store: {
          _id: store._id,
          shopName: store.shopName,
          shopAddress: store.shopAddress,
          contactNumber: store.contactNumber,
          milkTypes: store.milkTypes,
          defaultMilkRate: store.defaultMilkRate,

          isActive: store.isActive,
          isSuspended: store.isSuspended,

          planExpiresAt: store.planExpiresAt,
          planDaysLeft: daysLeft < 0 ? 0 : daysLeft,

          createdAt: store.createdAt,
        },

        owner: store.userId,

        currentPlan: store.planId,

        planHistory,
      },
      "Store detail fetched"
    )
  );
});

/* ===================================================
   3) APPROVE / REJECT
   PATCH /api/super-admin/store/:id/active
=================================================== */
const updateStoreActiveStatus = asyncHandler(async (req, res) => {
  const storeId = req.params.id;
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be boolean");
  }

  const store = await Store.findByIdAndUpdate(
    storeId,
    { isActive },
    { new: true }
  )
    .populate("userId", "name mobile email")
    .populate("planId", "name price");

  if (!store) throw new ApiError(404, "Store not found");

  return res.status(200).json(
    new ApiResponse(
      200,
      store,
      `Store ${isActive ? "approved" : "rejected"} successfully`
    )
  );
});

/* ===================================================
   4) SUSPEND / UNSUSPEND
   PATCH /api/super-admin/store/:id/suspend
=================================================== */
const updateStoreSuspendStatus = asyncHandler(async (req, res) => {
  const storeId = req.params.id;
  const { isSuspended } = req.body;

  if (typeof isSuspended !== "boolean") {
    throw new ApiError(400, "isSuspended must be boolean");
  }

  const store = await Store.findByIdAndUpdate(
    storeId,
    { isSuspended },
    { new: true }
  )
    .populate("userId", "name mobile email")
    .populate("planId", "name price");

  if (!store) throw new ApiError(404, "Store not found");

  return res.status(200).json(
    new ApiResponse(
      200,
      store,
      `Store ${isSuspended ? "suspended" : "unsuspended"} successfully`
    )
  );
});

module.exports = {
  getStoreListForTable,
  getStoreDetailsById,
  updateStoreActiveStatus,
  updateStoreSuspendStatus,
};
