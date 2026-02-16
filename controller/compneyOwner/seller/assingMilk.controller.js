const Store = require("../../../models/Store.model");
const Seller = require("../../../models/Seller.model");
const MilkAssign = require("../../../models/MilkAssing.model");
const Stock = require("../../../models/Stock");

const ApiError = require("../../../utils/apiError");
const asyncHandler = require("../../../utils/asyncHandle");

const { normalizeDate, recalcClosingStock } = require("../../../utils/stockHelper");

/* ==============================
   CREATE MILK ASSIGN
   (Owner -> Seller)
============================== */
const createMilkAssign = asyncHandler(async (req, res) => {
  const { sellerId, milkType, quantity, date } = req.body;

  if (!sellerId || !milkType || !quantity || !date) {
    throw new ApiError(400, "Required fields are missing");
  }

  if (!["cow", "buffalo"].includes(milkType)) {
    throw new ApiError(400, "Invalid milk type");
  }

  const qty = Number(quantity);
  if (qty <= 0) throw new ApiError(400, "Quantity must be > 0");

  // store find
  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found");

  // seller belongs to store check
  const seller = await Seller.findOne({
    _id: sellerId,
    storeID: store._id,
    isActive: true,
  });

  if (!seller) throw new ApiError(404, "Seller not found for this store");

  const assignDate = normalizeDate(date);

  // duplicate check
  const exists = await MilkAssign.findOne({
    storeID: store._id,
    sellerId,
    milkType,
    date: assignDate,
  });

  if (exists) {
    throw new ApiError(409, "Milk already assigned for this seller on this date");
  }

  // stock doc must exist
  const stock = await Stock.findOne({
    storeID: store._id,
    date: assignDate,
    milkType,
  });

  if (!stock) {
    throw new ApiError(400, "No stock record found for this date & milk type");
  }

  // Available milk check (based on closingStock)
  const available = Number(stock.closingStock || 0);

  if (available < qty) {
    throw new ApiError(400, `Not enough stock. Available: ${available}L`);
  }

  // create assign record
  const assign = await MilkAssign.create({
    storeID: store._id,
    sellerId,
    milkType,
    quantity: qty,
    date: assignDate,
    createdBy: req.user._id,
  });

  // stock update
  stock.sellerTotalAssign = (stock.sellerTotalAssign || 0) + qty;
  stock.sellerRemainingMilk = (stock.sellerRemainingMilk || 0) + qty;

  // NOTE: closingStock yaha reduce nahi hoga (delivery pe reduce hoga)
  await recalcClosingStock(stock);

  return res.status(201).json({
    success: true,
    message: "Milk assigned successfully",
    data: assign,
  });
});

/* ==============================
   GET ALL ASSIGNS (STORE)
============================== */
const getAllMilkAssigns = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found");

  const assigns = await MilkAssign.find({ storeID: store._id })
    .populate({
      path: "sellerId",
      populate: { path: "userId", select: "name mobile" },
    })
    .sort({ date: -1 });

  return res.status(200).json({
    success: true,
    data: assigns,
  });
});

/* ==============================
   UPDATE ASSIGN
============================== */
const updateMilkAssign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found");

  const assign = await MilkAssign.findOne({
    _id: id,
    storeID: store._id,
  });

  if (!assign) throw new ApiError(404, "Assign record not found");

  const oldQty = Number(assign.quantity);
  const newQty = Number(quantity);

  if (!newQty || newQty <= 0) {
    throw new ApiError(400, "Quantity must be > 0");
  }

  const assignDate = normalizeDate(assign.date);

  const stock = await Stock.findOne({
    storeID: store._id,
    date: assignDate,
    milkType: assign.milkType,
  });

  if (!stock) throw new ApiError(400, "Stock not found for this date");

  // stock reverse old
  stock.sellerTotalAssign = Math.max(0, (stock.sellerTotalAssign || 0) - oldQty);
  stock.sellerRemainingMilk = Math.max(0, (stock.sellerRemainingMilk || 0) - oldQty);

  // check available now
  const available = Number(stock.closingStock || 0);

  if (available < newQty) {
    // rollback
    stock.sellerTotalAssign = (stock.sellerTotalAssign || 0) + oldQty;
    stock.sellerRemainingMilk = (stock.sellerRemainingMilk || 0) + oldQty;
    await recalcClosingStock(stock);

    throw new ApiError(400, `Not enough stock. Available: ${available}L`);
  }

  // apply new
  stock.sellerTotalAssign = (stock.sellerTotalAssign || 0) + newQty;
  stock.sellerRemainingMilk = (stock.sellerRemainingMilk || 0) + newQty;

  await recalcClosingStock(stock);

  assign.quantity = newQty;
  await assign.save();

  return res.status(200).json({
    success: true,
    message: "Milk assign updated successfully",
    data: assign,
  });
});

/* ==============================
   DELETE ASSIGN
============================== */
const deleteMilkAssign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found");

  const assign = await MilkAssign.findOne({
    _id: id,
    storeID: store._id,
  });

  if (!assign) throw new ApiError(404, "Assign record not found");

  const qty = Number(assign.quantity);
  const assignDate = normalizeDate(assign.date);

  const stock = await Stock.findOne({
    storeID: store._id,
    date: assignDate,
    milkType: assign.milkType,
  });

  // delete assign
  await MilkAssign.deleteOne({ _id: id });

  // reverse stock
  if (stock) {
    stock.sellerTotalAssign = Math.max(0, (stock.sellerTotalAssign || 0) - qty);
    stock.sellerRemainingMilk = Math.max(0, (stock.sellerRemainingMilk || 0) - qty);
    await recalcClosingStock(stock);
  }

  return res.status(200).json({
    success: true,
    message: "Milk assign deleted successfully",
  });
});

/* ==============================
   GET ASSIGNS BY SELLER (History)
============================== */
const getMilkAssignsBySellerHistory = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found");

  const assigns = await MilkAssign.find({
    storeID: store._id,
    sellerId,
  })
    .populate({
      path: "sellerId",
      populate: { path: "userId", select: "name mobile address" },
    })
    .sort({ date: -1 });

  return res.status(200).json({
    success: true,
    data: assigns,
  });
});


const getSellerTodaySummary = asyncHandler(async (req, res) => {
    const { sellerId } = req.params;
    const { date, milkType } = req.query;

    const store = await Store.findOne({ userId: req.user._id });
    if (!store) throw new ApiError(404, "Store not found");

    const stockDate = normalizeDate(date || new Date());

    const stock = await Stock.findOne({
        storeID: store._id,
        date: stockDate,
        milkType: milkType || "cow",
    });

    if (!stock) {
        return res.status(200).json({
            success: true,
            data: {
                date: stockDate,
                milkType: milkType || "cow",
                totalProcured: 0,
                sellerTotalAssign: 0,
                sellerSoldQty: 0,
                sellerRemainingMilk: 0,
                directSoldQty: 0,
                wastage: 0,
                closingStock: 0,
            },
        });
    }
    return res.status(200).json({
        success: true,
        data: stock,
    });
});

module.exports = {
  createMilkAssign,
  getAllMilkAssigns,
  updateMilkAssign,
  deleteMilkAssign,
  getMilkAssignsBySellerHistory,
  getSellerTodaySummary
};
