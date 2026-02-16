const Store = require("../../models/Store.model");
const Seller = require("../../models/Seller.model");
const Customer = require("../../models/Customer.model");
const MilkDelivery = require("../../models/MilkDelivery.model");
const Stock = require("../../models/Stock");

const ApiError = require("../../utils/apiError");
const asyncHandler = require("../../utils/asyncHandle");
const { normalizeDate, recalcClosingStock } = require("../../utils/stockHelper");

/* ==============================
   SELLER CREATE DELIVERY
============================== */
const createMilkDelivery = asyncHandler(async (req, res) => {
  const { customerId, milkQty, milkType, date } = req.body;

  if (!customerId || !milkQty || !milkType || !date) {
    throw new ApiError(400, "Required fields missing");
  }

  const qty = Number(milkQty);
  if (qty <= 0) throw new ApiError(400, "Milk quantity must be > 0");

  const seller = await Seller.findOne({ userId: req.user._id, isActive: true });
  if (!seller) throw new ApiError(404, "Seller not found");

  const storeID = seller.storeID;

  // customer belongs to same store
  const customer = await Customer.findOne({
    _id: customerId,
    storeID: storeID,
    isActive: true,
  });

  if (!customer) throw new ApiError(404, "Customer not found");

  const deliveryDate = normalizeDate(date);

  // prevent duplicate delivery same day
  const exists = await MilkDelivery.findOne({
    customerId,
    sellerId: seller._id,
    date: deliveryDate,
  });

  if (exists) {
    // difference qty
    const oldQty = Number(exists.milkQty || 0);
    const newQty = qty;

    const diff = newQty - oldQty; // extra milk needed

    // stock check only if diff is positive
    if (diff > 0) {
      if (sellerRemaining < diff) {
        throw new ApiError(
          400,
          `Seller remaining milk not enough. Remaining: ${sellerRemaining}L`
        );
      }
    }

    // update delivery
    exists.milkQty = newQty;
    exists.milkType = milkType;
    await exists.save();

    // stock update (only diff)
    stock.sellerSoldQty = (stock.sellerSoldQty || 0) + diff;
    stock.sellerRemainingMilk = Math.max(
      0,
      (stock.sellerRemainingMilk || 0) - diff
    );

    await recalcClosingStock(stock);

    return res.status(200).json({
      success: true,
      message: "Milk delivery updated successfully",
      data: exists,
    });
  }

  // stock check
  const stock = await Stock.findOne({
    storeID,
    date: deliveryDate,
    milkType,
  });

  if (!stock) throw new ApiError(400, "Stock not found for today");

  // seller remaining milk check
  const sellerRemaining = Number(stock.sellerRemainingMilk || 0);

  if (sellerRemaining < qty) {
    throw new ApiError(
      400,
      `Seller remaining milk not enough. Remaining: ${sellerRemaining}L`
    );
  }

  // create delivery
  const delivery = await MilkDelivery.create({
    date: deliveryDate,
    storeID,
    sellerId: seller._id,
    customerId,
    milkType,
    milkQty: qty,
    status: "delivered",
  });

  // stock update
  stock.sellerSoldQty = (stock.sellerSoldQty || 0) + qty;
  stock.sellerRemainingMilk = Math.max(0, (stock.sellerRemainingMilk || 0) - qty);

  await recalcClosingStock(stock);

  return res.status(201).json({
    success: true,
    message: "Milk delivery marked successfully",
    data: delivery,
  });
});


const getSellerCustomers = asyncHandler(async (req, res) => {
  // 1) Seller find
  const seller = await Seller.findOne({ userId: req.user._id, isActive: true });

  if (!seller) throw new ApiError(404, "Seller not found");

  const storeID = seller.storeID;
  // 2) seller assigned areas
  const assignedAreaIds = seller.assignedAreaIds || [];

  if (assignedAreaIds.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No areas assigned to seller",
      data: [],
    });
  }

  // 3) Customers in same store + only assigned areas
  const customers = await Customer.find({
    storeID,
    addressId: { $in: assignedAreaIds },
    isActive: true,
  })
    .populate("userId", "name mobile profileImage role")
    .populate("addressId", "areaName city pincode")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: "Seller customers fetched",
    data: customers,
  });
});


module.exports = {
  createMilkDelivery,
  getSellerCustomers
};
