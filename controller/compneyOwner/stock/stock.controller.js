const Stock = require("../../../models/Stock");
const Store = require("../../../models/Store.model");

const ApiError = require("../../../utils/apiError");
const asyncHandler = require("../../../utils/asyncHandle");
const { normalizeDate } = require("../../../utils/stockHelper");

/**
 * ✅ GET TODAY STOCK (OWNER)
 * GET /api/store/stock/today
 */
const getTodayStock = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  // ✅ Find store of this owner
  const store = await Store.findOne({ userId, isActive: true });
  if (!store) throw new ApiError(404, "Store not found");

  // ✅ Today normalized (00:00:00)
  const today = normalizeDate(new Date());

  // ✅ Fetch both cow & buffalo for today
  const stockRecords = await Stock.find({
    storeID: store._id,
    date: today,
  }).sort({ milkType: 1 });

  // ✅ Default response (agar record nahi ho to bhi)
  const defaultStock = {
    totalProcured: 0,
    sellerTotalAssign: 0,
    sellerSoldQty: 0,
    sellerRemainingMilk: 0,
    directSoldQty: 0,
    wastage: 0,
    closingStock: 0,
  };

  // cow / buffalo split
  const cow = stockRecords.find((x) => x.milkType === "cow");
  const buffalo = stockRecords.find((x) => x.milkType === "buffalo");

  return res.status(200).json({
    success: true,
    message: "Today stock fetched successfully",
    data: {
      storeID: store._id,
      date: today,
      cow: cow || { milkType: "cow", ...defaultStock },
      buffalo: buffalo || { milkType: "buffalo", ...defaultStock },
    },
  });
});

module.exports = {
  getTodayStock,
};
