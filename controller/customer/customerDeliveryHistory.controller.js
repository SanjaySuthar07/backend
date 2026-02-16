const Customer = require("../../models/Customer.model");
const MilkDelivery = require("../../models/MilkDelivery.model");

const ApiError = require("../../utils/apiError");
const asyncHandler = require("../../utils/asyncHandle");
const { normalizeDate } = require("../../utils/stockHelper");

/* ==============================
   Helper: Month range
============================== */
const getMonthRange = (year, monthIndex) => {
    // monthIndex: 0 = Jan, 11 = Dec
    const start = new Date(year, monthIndex, 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(year, monthIndex + 1, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

/* ==============================
   CUSTOMER DELIVERY HISTORY (THIS MONTH)
============================== */
const getCustomerThisMonthDeliveryHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const customer = await Customer.findOne({ userId, isActive: true });
    if (!customer) throw new ApiError(404, "Customer not found");

    const now = new Date();
    const { start, end } = getMonthRange(now.getFullYear(), now.getMonth());

    const deliveries = await MilkDelivery.find({
        customerId: customer._id,
        date: { $gte: start, $lte: end },
    })
        .populate("sellerId", "userId storeID")
        .select("date milkQty milkType status sellerId storeID createdAt")
        .sort({ date: -1 });

    return res.status(200).json({
        success: true,
        message: "This month delivery history fetched",
        data: {
            period: {
                startDate: start,
                endDate: end,
                type: "this_month",
            },
            totalRecords: deliveries.length,
            deliveries,
        },
    });
});

/* ==============================
   CUSTOMER DELIVERY HISTORY (PREVIOUS MONTH)
============================== */
const getCustomerPreviousMonthDeliveryHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const customer = await Customer.findOne({ userId, isActive: true });
    if (!customer) throw new ApiError(404, "Customer not found");

    const now = new Date();

    // previous month calculation
    let year = now.getFullYear();
    let monthIndex = now.getMonth() - 1;

    if (monthIndex < 0) {
        monthIndex = 11;
        year = year - 1;
    }

    const { start, end } = getMonthRange(year, monthIndex);

    const deliveries = await MilkDelivery.find({
        customerId: customer._id,
        date: { $gte: start, $lte: end },
    })
        .populate("sellerId", "userId storeID")
        .select("date milkQty milkType status sellerId storeID createdAt")
        .sort({ date: -1 });

    return res.status(200).json({
        success: true,
        message: "Previous month delivery history fetched",
        data: {
            period: {
                startDate: start,
                endDate: end,
                type: "previous_month",
            },
            totalRecords: deliveries.length,
            deliveries,
        },
    });
});

module.exports = {
    getCustomerThisMonthDeliveryHistory,
    getCustomerPreviousMonthDeliveryHistory,
};
