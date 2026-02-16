const Vendor = require("../../../models/Vendor.model");
const Store = require("../../../models/Store.model");
const ApiError = require("../../../utils/apiError");
const asyncHandler = require("../../../utils/asyncHandle");

const createVendor = asyncHandler(async (req, res) => {
    const { name, mobile, address } = req.body;

    if (!name || !mobile) {
        throw new ApiError(400, "Vendor name and mobile are required");
    }

    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found for this owner");
    }

    const existingVendor = await Vendor.findOne({
        storeID: store._id,
        mobile: mobile.trim(),
        isActive: true
    });

    if (existingVendor) {
        throw new ApiError(409, "Vendor with this mobile already exists");
    }

    const vendor = await Vendor.create({
        name: name.trim(),
        mobile: mobile.trim(),
        address: address?.trim(),
        storeID: store._id
    });

    res.status(201).json({
        success: true,
        message: "Vendor created successfully",
        data: vendor
    });
});

/**
 * GET ALL VENDORS
 */
const getAllVendors = asyncHandler(async (req, res) => {
    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found");
    }

    const vendors = await Vendor.find({
        storeID: store._id,
        isActive: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: vendors
    });
});

/**
 * UPDATE VENDOR
 */
const updateVendor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, mobile, address, isActive } = req.body;

    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found");
    }

    const updatePayload = {};
    if (name) updatePayload.name = name.trim();
    if (mobile) updatePayload.mobile = mobile.trim();
    if (address) updatePayload.address = address.trim();
    if (typeof isActive === "boolean") updatePayload.isActive = isActive;

    const vendor = await Vendor.findOneAndUpdate(
        { _id: id, storeID: store._id },
        updatePayload,
        { new: true, runValidators: true }
    );

    if (!vendor) {
        throw new ApiError(404, "Vendor not found");
    }

    res.status(200).json({
        success: true,
        message: "Vendor updated successfully",
        data: vendor
    });
});

/**
 * DELETE VENDOR (SOFT DELETE)
 */
const deleteVendor = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
        throw new ApiError(404, "Store not found");
    }

    const vendor = await Vendor.findOneAndUpdate(
        { _id: id, storeID: store._id },
        { isActive: false },
        { new: true }
    );

    if (!vendor) {
        throw new ApiError(404, "Vendor not found");
    }

    res.status(200).json({
        success: true,
        message: "Vendor deleted successfully"
    });
});

module.exports = {
    createVendor,
    getAllVendors,
    updateVendor,
    deleteVendor
};