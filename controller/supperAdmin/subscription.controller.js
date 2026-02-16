const SubscriptionPlan = require("../../models/SubscriptionPlan.model");
const ApiError = require("../../utils/apiError");
const ApiResponse = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandle");

// ================= CREATE PLAN =================
const createPlan = asyncHandler(async (req, res) => {
    const {
        name,
        maxCustomers,
        maxSellers,
        price,
        planType,
        duration,
        features
    } = req.body;

    if (
        !name ||
        maxCustomers === undefined ||
        maxSellers === undefined ||
        price === undefined ||
        !planType ||
        !duration
    ) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const plan = await SubscriptionPlan.create({
        name: name.trim(),
        maxCustomers,
        maxSellers,
        price,
        planType,
        duration,
        features: Array.isArray(features) ? features : [],
        createdBy: req.user._id
    });

    res.status(201).json(
        new ApiResponse(201, plan, "Subscription plan created successfully")
    );
});

// ================= GET ALL PLANS =================
const getAllPlans = asyncHandler(async (req, res) => {
    const plans = await SubscriptionPlan.find({ isActive: true })
        .select("-__v")
        .sort({ price: 1 });

    res.status(200).json(
        new ApiResponse(200, plans, "Subscription plans fetched")
    );
});

// ================= GET SINGLE PLAN =================
const getPlanById = asyncHandler(async (req, res) => {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
        throw new ApiError(404, "Subscription plan not found");
    }

    res.status(200).json(
        new ApiResponse(200, plan, "Subscription plan fetched")
    );
});

// ================= UPDATE PLAN =================
const updatePlan = asyncHandler(async (req, res) => {
    const {
        name,
        maxCustomers,
        maxSellers,
        price,
        planType,
        duration,
        features,
        isActive
    } = req.body;

    const updatePayload = {};

    if (name) updatePayload.name = name.trim();
    if (maxCustomers !== undefined) updatePayload.maxCustomers = maxCustomers;
    if (maxSellers !== undefined) updatePayload.maxSellers = maxSellers;
    if (price !== undefined) updatePayload.price = price;
    if (planType) updatePayload.planType = planType;
    if (duration) updatePayload.duration = duration;
    if (Array.isArray(features)) updatePayload.features = features;
    if (typeof isActive === "boolean") updatePayload.isActive = isActive;

    updatePayload.updatedBy = req.user._id;

    const plan = await SubscriptionPlan.findByIdAndUpdate(
        req.params.id,
        updatePayload,
        { new: true, runValidators: true }
    );

    if (!plan) {
        throw new ApiError(404, "Subscription plan not found");
    }

    res.status(200).json(
        new ApiResponse(200, plan, "Subscription plan updated successfully")
    );
});

// ================= UPDATE PLAN STATUS =================
const updatePlanStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
        throw new ApiError(400, "isActive must be boolean");
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
    );

    if (!plan) {
        throw new ApiError(404, "Subscription plan not found");
    }

    res.status(200).json(
        new ApiResponse(200, plan, "Plan status updated successfully")
    );
});

module.exports = {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    updatePlanStatus
};
