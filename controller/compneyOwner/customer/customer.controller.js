const Customer = require("../../../models/Customer.model");
const User = require("../../../models/User.model");
const Store = require("../../../models/Store.model");
const ApiError = require("../../../utils/apiError");
const asyncHandler = require("../../../utils/asyncHandle");

/* =========================
   CREATE CUSTOMER
========================= */
const createCustomer = asyncHandler(async (req, res) => {
  const {
    userId,
    addressId,
    fullAddress,
    milkType,
    dailyQty,
    ratePerLiter,
    billingStartDate,
  } = req.body;

  if (!userId || !addressId || !fullAddress || !milkType) {
    throw new ApiError(400, "Required fields missing");
  }

  // ✅ milkType validation
  const allowedMilkTypes = ["cow", "buffalo"];
  if (!allowedMilkTypes.includes(milkType)) {
    throw new ApiError(400, "Milk type must be cow or buffalo");
  }

  const store = await Store.findOne({ userId: req.user._id });
  if (!store) throw new ApiError(404, "Store not found for owner");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (user.role === "seller") {
    throw new ApiError(400, "Seller cannot be added as customer");
  }

  const exists = await Customer.findOne({ userId });
  if (exists) throw new ApiError(409, "Customer already exists");

  user.role = "customer";
  await user.save({ validateBeforeSave: false });

  const customer = await Customer.create({
    userId,
    storeID: store._id,
    addressId,
    fullAddress,
    milkType,
    dailyQty,
    ratePerLiter,

    // ✅ required field fix
    billingStartDate: billingStartDate ? new Date(billingStartDate) : new Date(),
  });

  res.status(201).json({
    success: true,
    message: "Customer created successfully",
    data: customer,
  });
});

/* =========================
   GET ALL CUSTOMERS
========================= */
const getAllCustomers = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ userId: req.user._id });
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const customers = await Customer.find({
    storeID: store._id,
    isActive: true,
  })
    .populate("userId", "name mobile role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: customers,
  });
});

/* =========================
   UPDATE CUSTOMER
========================= */
const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const store = await Store.findOne({ userId: req.user._id });
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: id, storeID: store._id },
    updatePayload,
    { new: true }
  );

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  res.status(200).json({
    success: true,
    message: "Customer updated successfully",
    data: customer,
  });
});

/* =========================
   DELETE CUSTOMER (SOFT)
========================= */
const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const store = await Store.findOne({ userId: req.user._id });
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: id, storeID: store._id },
    { isActive: false },
    { new: true }
  );

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  res.status(200).json({
    success: true,
    message: "Customer deleted successfully",
  });
});

module.exports = {
  createCustomer,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
};
