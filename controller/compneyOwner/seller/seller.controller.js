const Seller = require("../../../models/Seller.model");
const User = require("../../../models/User.model");
const Store = require("../../../models/Store.model");
const ApiError = require("../../../utils/apiError");
const asyncHandler = require("../../../utils/asyncHandle");

/* =========================
   CREATE SELLER
   (customer → seller)
========================= */
const createSeller = asyncHandler(async (req, res) => {
    const { userId, assignedAreaIds = [] } = req.body;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    // Owner ka store
    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found for owner");
    }

    // User check
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Already seller?
    const exists = await Seller.findOne({ userId });
    if (exists) {
        throw new ApiError(409, "User is already a seller");
    }

    // Role update (customer → seller)
    user.role = "seller";
    await user.save({ validateBeforeSave: false });

    // Create seller
    const seller = await Seller.create({
        userId,
        storeID: store._id,
        assignedAreaIds,
    });

    res.status(201).json({
        success: true,
        message: "Seller created successfully",
        data: seller,
    });
});

/* =========================
   GET ALL SELLERS
========================= */
const getAllSellers = asyncHandler(async (req, res) => {
    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found");
    }

    const sellers = await Seller.find({
        storeID: store._id,
        isActive: true,
    })
        .populate("userId", "name mobile role email address profileImage")
        .populate("assignedAreaIds", "areaName city pincode")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: sellers,
    });
});


/* =========================
   UPDATE SELLER
========================= */
const updateSeller = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignedAreaIds, isActive } = req.body;

    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found");
    }

    const updatePayload = {};
    if (assignedAreaIds) updatePayload.assignedAreaIds = assignedAreaIds;
    if (typeof isActive === "boolean") updatePayload.isActive = isActive;

    const seller = await Seller.findOneAndUpdate(
        { _id: id, storeID: store._id },
        updatePayload,
        { new: true }
    );

    if (!seller) {
        throw new ApiError(404, "Seller not found");
    }

    res.status(200).json({
        success: true,
        message: "Seller updated successfully",
        data: seller,
    });
});

/* =========================
   DELETE SELLER (SOFT)
========================= */
const deleteSeller = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found");
    }

    const seller = await Seller.findOneAndUpdate(
        { _id: id, storeID: store._id },
        { isActive: false },
        { new: true }
    );

    if (!seller) {
        throw new ApiError(404, "Seller not found");
    }

    // Optional: role back to customer
    await User.findByIdAndUpdate(seller.userId, {
        role: "customer",
    });

    res.status(200).json({
        success: true,
        message: "Seller deleted successfully",
    });
});

module.exports = {
    createSeller,
    getAllSellers,
    updateSeller,
    deleteSeller,
};
