const User = require("../../../models/User.model");
const Store = require("../../../models/Store.model");
const SubscriptionPlan = require("../../../models/SubscriptionPlan.model");

const Customer = require("../../../models/Customer.model");
const Seller = require("../../../models/Seller.model");
const Vendor = require("../../../models/Vendor.model");
const Address = require("../../../models/Address.model");

const ApiError = require("../../../utils/apiError");
const asyncHandler = require("../../../utils/asyncHandle");

/* ==============================
   GET STORE PROFILE
============================== */
const getStoreProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  // Owner user
  const owner = await User.findById(userId).select(
    "name email mobile address role isActive isBlocked profileImage lastLoginAt createdAt"
  );

  if (!owner) throw new ApiError(404, "Owner not found");

  // Store
  const store = await Store.findOne({ userId: owner._id })
    .populate("planId", "name maxCustomers maxSellers price planType duration features isActive")
    .select(
      "shopName shopAddress contactNumber milkTypes defaultMilkRate planId planExpiresAt isActive isSuspended createdAt"
    );

  if (!store) throw new ApiError(404, "Store not found");

  // Stats
  const [
    totalCustomers,
    totalSellers,
    totalVendors,
    totalAreas,
  ] = await Promise.all([
    Customer.countDocuments({ storeID: store._id, isActive: true }),
    Seller.countDocuments({ storeID: store._id, isActive: true }),
    Vendor.countDocuments({ storeID: store._id, isActive: true }),
    Address.countDocuments({ storeID: store._id, isActive: true }),
  ]);

  // Plan status
  const now = new Date();
  const planExpiresAt = store.planExpiresAt ? new Date(store.planExpiresAt) : null;

  let planExpired = false;
  let planDaysLeft = null;

  if (planExpiresAt) {
    planExpired = planExpiresAt < now;

    const diffMs = planExpiresAt.getTime() - now.getTime();
    planDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (planDaysLeft < 0) planDaysLeft = 0;
  }

  return res.status(200).json({
    success: true,
    message: "Store profile fetched successfully",
    data: {
      owner,
      store,
      stats: {
        totalCustomers,
        totalSellers,
        totalVendors,
        totalAreas,
      },
      plan: {
        planExpired,
        planDaysLeft,
      },
    },
  });
});

/* ==============================
   UPDATE STORE PROFILE
============================== */
const updateStoreProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { owner, store } = req.body;

  // owner fields
  const ownerUpdate = {};
  if (owner?.name) ownerUpdate.name = owner.name;
  if (owner?.email) ownerUpdate.email = owner.email;
  if (owner?.address) ownerUpdate.address = owner.address;
  if (owner?.profileImage !== undefined) ownerUpdate.profileImage = owner.profileImage;

  // store fields
  const storeUpdate = {};
  if (store?.shopName) storeUpdate.shopName = store.shopName;
  if (store?.shopAddress !== undefined) storeUpdate.shopAddress = store.shopAddress;
  if (store?.contactNumber !== undefined) storeUpdate.contactNumber = store.contactNumber;
  if (store?.milkTypes) storeUpdate.milkTypes = store.milkTypes;
  if (store?.defaultMilkRate !== undefined) storeUpdate.defaultMilkRate = store.defaultMilkRate;

  // Update owner
  const updatedOwner = await User.findByIdAndUpdate(
    userId,
    { $set: ownerUpdate },
    { new: true }
  ).select("name email mobile address role isActive isBlocked profileImage lastLoginAt createdAt");

  if (!updatedOwner) throw new ApiError(404, "Owner not found");

  // Update store
  const updatedStore = await Store.findOneAndUpdate(
    { userId },
    { $set: storeUpdate },
    { new: true }
  )
    .populate("planId", "name maxCustomers maxSellers price planType duration features isActive")
    .select(
      "shopName shopAddress contactNumber milkTypes defaultMilkRate planId planExpiresAt isActive isSuspended createdAt"
    );

  if (!updatedStore) throw new ApiError(404, "Store not found");

  return res.status(200).json({
    success: true,
    message: "Store profile updated successfully",
    data: {
      owner: updatedOwner,
      store: updatedStore,
    },
  });
});

module.exports = {
  getStoreProfile,
  updateStoreProfile,
};
