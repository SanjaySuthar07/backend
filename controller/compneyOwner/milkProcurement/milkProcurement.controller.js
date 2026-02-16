const MilkProcurement = require("../../../models/MilkProcurement.model");
const Vendor = require("../../../models/Vendor.model");
const Store = require("../../../models/Store.model");
const Stock = require("../../../models/Stock");

const ApiError = require("../../../utils/apiError");
const asyncHandler = require("../../../utils/asyncHandle");

const { normalizeDate, recalcClosingStock } = require("../../../utils/stockHelper");

/* =========================================
   CREATE MILK PROCUREMENT + STOCK++
========================================= */
const createMilkProcurement = asyncHandler(async (req, res) => {
  const { vendorId, milkTypesSupplied, quantity, ratePerLiter, date, notes } =
    req.body;

  if (!vendorId || !quantity || !ratePerLiter || !date) {
    throw new ApiError(400, "Required fields are missing");
  }

  const qty = Number(quantity);
  const rate = Number(ratePerLiter);

  if (qty <= 0) throw new ApiError(400, "Quantity must be > 0");
  if (rate <= 0) throw new ApiError(400, "Rate must be > 0");

  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found");

  const vendor = await Vendor.findOne({
    _id: vendorId,
    storeID: store._id,
    isActive: true,
  });

  if (!vendor) throw new ApiError(404, "Vendor not found for this store");

  const procurementDate = normalizeDate(date);

  // ⚠️ duplicate check vendor + date (store wise)
  const existingEntry = await MilkProcurement.findOne({
    vendorId,
    storeID: store._id,
    date: procurementDate,
  });

  if (existingEntry) {
    throw new ApiError(
      409,
      "Milk procurement already exists for this vendor on this date"
    );
  }

  const totalAmount = qty * rate;

  // 🟢 Create procurement
  const procurement = await MilkProcurement.create({
    vendorId,
    storeID: store._id,
    milkTypesSupplied,
    quantity: qty,
    ratePerLiter: rate,
    totalAmount,
    date: procurementDate,
    notes,
  });

  // 🟢 Stock update
  const milkType = milkTypesSupplied?.[0] || "cow";

  let stock = await Stock.findOne({
    storeID: store._id,
    date: procurementDate,
    milkType,
  });

  // agar stock record nahi hai to create karo
  if (!stock) {
    stock = await Stock.create({
      storeID: store._id,
      date: procurementDate,
      milkType,
    });
  }

  stock.totalProcured = (stock.totalProcured || 0) + qty;
  await recalcClosingStock(stock);

  return res.status(201).json({
    success: true,
    message: "Milk procurement added successfully",
    data: procurement,
  });
});

/* =========================================
   GET ALL MILK PROCUREMENTS (STORE)
========================================= */
const getAllMilkProcurements = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found");

  const procurements = await MilkProcurement.find({
    storeID: store._id,
  })
    .populate("vendorId", "name mobile")
    .sort({ date: -1 });

  return res.status(200).json({
    success: true,
    data: procurements,
  });
});

/* =========================================
   UPDATE MILK PROCUREMENT + STOCK ADJUST
========================================= */
const updateMilkProcurement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { milkTypesSupplied, quantity, ratePerLiter, notes } = req.body;

  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found");

  const procurement = await MilkProcurement.findOne({
    _id: id,
    storeID: store._id,
  });

  if (!procurement) throw new ApiError(404, "Milk procurement not found");

  // OLD values
  const oldQty = Number(procurement.quantity);
  const oldMilkType = procurement.milkTypesSupplied?.[0] || "cow";
  const stockDate = normalizeDate(procurement.date);

  // NEW values
  const newQty = quantity !== undefined ? Number(quantity) : oldQty;
  const newMilkType = milkTypesSupplied?.[0] || oldMilkType;

  if (newQty <= 0) throw new ApiError(400, "Quantity must be > 0");

  // update procurement
  if (milkTypesSupplied) procurement.milkTypesSupplied = milkTypesSupplied;
  if (quantity !== undefined) procurement.quantity = newQty;
  if (ratePerLiter !== undefined) procurement.ratePerLiter = Number(ratePerLiter);
  if (notes !== undefined) procurement.notes = notes;

  procurement.totalAmount = Number(procurement.quantity) * Number(procurement.ratePerLiter);
  await procurement.save();

  // ==============================
  // 🟢 STOCK UPDATE
  // ==============================

  // 1) old stock - oldQty
  const oldStock = await Stock.findOne({
    storeID: store._id,
    date: stockDate,
    milkType: oldMilkType,
  });

  if (oldStock) {
    oldStock.totalProcured = Math.max(0, (oldStock.totalProcured || 0) - oldQty);
    await recalcClosingStock(oldStock);
  }

  // 2) new stock + newQty
  let newStock = await Stock.findOne({
    storeID: store._id,
    date: stockDate,
    milkType: newMilkType,
  });

  if (!newStock) {
    newStock = await Stock.create({
      storeID: store._id,
      date: stockDate,
      milkType: newMilkType,
    });
  }

  newStock.totalProcured = (newStock.totalProcured || 0) + newQty;
  await recalcClosingStock(newStock);

  return res.status(200).json({
    success: true,
    message: "Milk procurement updated successfully",
    data: procurement,
  });
});

/* =========================================
   DELETE MILK PROCUREMENT + STOCK--
========================================= */
const deleteMilkProcurement = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found");

  const procurement = await MilkProcurement.findOne({
    _id: id,
    storeID: store._id,
  });

  if (!procurement) throw new ApiError(404, "Milk procurement not found");

  const qty = Number(procurement.quantity);
  const milkType = procurement.milkTypesSupplied?.[0] || "cow";
  const stockDate = normalizeDate(procurement.date);

  // delete procurement
  await MilkProcurement.deleteOne({ _id: id });

  // stock minus
  const stock = await Stock.findOne({
    storeID: store._id,
    date: stockDate,
    milkType,
  });

  if (stock) {
    stock.totalProcured = Math.max(0, (stock.totalProcured || 0) - qty);
    await recalcClosingStock(stock);
  }

  return res.status(200).json({
    success: true,
    message: "Milk procurement deleted successfully",
  });
});

const getVendorMilkProcurements = asyncHandler(async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    throw new ApiError(400, "VendorId is required");
  }

  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found");

  // vendor belongs to same store check
  const vendor = await Vendor.findOne({
    _id: vendorId,
    storeID: store._id,
    isActive: true,
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found for this store");
  }

  const procurements = await MilkProcurement.find({
    storeID: store._id,
    vendorId: vendorId,
  })
    .populate("vendorId", "name mobile")
    .sort({ date: -1 });

  return res.status(200).json({
    success: true,
    data: procurements,
  });
});


module.exports = {
  createMilkProcurement,
  getAllMilkProcurements,
  updateMilkProcurement,
  deleteMilkProcurement,
  getVendorMilkProcurements,
};
