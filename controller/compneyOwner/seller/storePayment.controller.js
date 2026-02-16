const Store = require("../../../models/Store.model");
const Payment = require("../../../models/Payment.model");
const Seller = require("../../../models/Seller.model");

const ApiError = require("../../../utils/apiError");
const asyncHandler = require("../../../utils/asyncHandle");

/* ==============================
   OWNER: TODAY PAYMENTS (STORE)
============================== */
const getStoreTodayPayments = asyncHandler(async (req, res) => {
  // req.user._id => owner userId
  const store = await Store.findOne({ userId: req.user._id, isActive: true });
  if (!store) throw new ApiError(404, "Store not found");

  const storeID = store._id;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const payments = await Payment.find({
    storeID,
    paymentDate: { $gte: start, $lte: end },
  })
    .populate("customerId", "userId fullAddress milkType dailyQty")
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name mobile profileImage" },
    })
    .populate("invoiceId", "invoiceNumber totalAmount paidAmount status")
    .populate("collectedBySellerId", "userId")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: "Store today payments fetched",
    data: payments,
  });
});

module.exports = {
  getStoreTodayPayments,
};
