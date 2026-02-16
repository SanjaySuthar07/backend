const Address = require("../../../models/Address.model");
const Store = require("../../../models/Store.model");
const ApiError = require("../../../utils/apiError");
const asyncHandler = require("../../../utils/asyncHandle");

/**
 * CREATE ADDRESS
 */
const createAddress = asyncHandler(async (req, res) => {
    const { areaName, city, pincode } = req.body;

    if (!areaName) {
        throw new ApiError(400, "Area name is required");
    }

    const store = await Store?.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found for this owner");
    }

    const existingArea = await Address.findOne({
        storeID: store._id,
        areaName: areaName.trim(),
        isActive: true
    });

    if (existingArea) {
        throw new ApiError(409, "Area already exists in this store");
    }

    const address = await Address.create({
        storeID: store._id,
        areaName: areaName.trim(),
        city: city?.trim(),
        pincode: pincode?.trim()
    });

    res.status(201).json({
        success: true,
        message: "Address created successfully",
        data: address
    });
});

/**
 * GET ALL ADDRESSES
 */
const getAllAddresses = asyncHandler(async (req, res) => {
    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found");
    }

    const addresses = await Address.find({
        storeID: store._id,
        isActive: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: addresses
    });
});

/**
 * UPDATE ADDRESS
 */
const updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { areaName, city, pincode, isActive } = req.body;

    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found");
    }

    const updatePayload = {};
    if (areaName) updatePayload.areaName = areaName.trim();
    if (city) updatePayload.city = city.trim();
    if (pincode) updatePayload.pincode = pincode.trim();
    if (typeof isActive === "boolean") updatePayload.isActive = isActive;

    const address = await Address.findOneAndUpdate(
        { _id: id, storeID: store._id },
        updatePayload,
        { new: true, runValidators: true }
    );

    if (!address) {
        throw new ApiError(404, "Address not found");
    }

    res.status(200).json({
        success: true,
        message: "Address updated successfully",
        data: address
    });
});

/**
 * DELETE ADDRESS (SOFT DELETE)
 */
const deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found");
    }

    const address = await Address.findOneAndUpdate(
        { _id: id, storeID: store._id },
        { isActive: false },
        { new: true }
    );

    if (!address) {
        throw new ApiError(404, "Address not found");
    }

    res.status(200).json({
        success: true,
        message: "Address deleted successfully"
    });
});

module.exports = {
    createAddress,
    getAllAddresses,
    updateAddress,
    deleteAddress
};
