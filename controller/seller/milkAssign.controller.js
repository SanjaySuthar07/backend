const MilkAssign = require("../../models/MilkAssing.model");
const Seller = require("../../models/Seller.model");
const ApiError = require("../../utils/apiError");
const asyncHandler = require("../../utils/asyncHandle");
const Stock = require("../../models/Stock");
// ✅ Helper: normalize date (00:00:00)
const normalizeDate = (dateInput) => {
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return d;
};

/* =========================
   TODAY MILK ASSIGN (SELLER)
========================= */
const getTodayMilkAssignForSeller = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1) Find seller by logged in user
    const seller = await Seller.findOne({ userId, isActive: true });
    if (!seller) throw new ApiError(404, "Seller not found");

    const today = normalizeDate(new Date());

    // 2) Find today assignments
    const assigns = await MilkAssign.find({
        sellerId: seller._id,
        storeID: seller.storeID,
        date: today,
    }).sort({ createdAt: -1 });

    // 3) Total qty
    const totalQty = assigns.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // 4) milkType wise total
    const milkTypeSummary = assigns.reduce((acc, item) => {
        acc[item.milkType] = (acc[item.milkType] || 0) + item.quantity;
        return acc;
    }, {});

    res.status(200).json({
        success: true,
        message: "Today milk assignment fetched successfully",
        data: {
            date: today,
            storeID: seller.storeID,
            sellerId: seller._id,
            totalQty,
            milkTypeSummary,
            assigns,
        },
    });
});

/* =========================
   DATE WISE MILK ASSIGN
========================= */
const getMilkAssignByDateForSeller = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { date } = req.params;

    if (!date) throw new ApiError(400, "Date is required");

    const seller = await Seller.findOne({ userId, isActive: true });
    if (!seller) throw new ApiError(404, "Seller not found");

    const selectedDate = normalizeDate(date);

    const assigns = await MilkAssign.find({
        sellerId: seller._id,
        storeID: seller.storeID,
        date: selectedDate,
    }).sort({ createdAt: -1 });

    const totalQty = assigns.reduce((sum, item) => sum + (item.quantity || 0), 0);

    const milkTypeSummary = assigns.reduce((acc, item) => {
        acc[item.milkType] = (acc[item.milkType] || 0) + item.quantity;
        return acc;
    }, {});

    res.status(200).json({
        success: true,
        message: "Milk assignment fetched successfully",
        data: {
            date: selectedDate,
            storeID: seller.storeID,
            sellerId: seller._id,
            totalQty,
            milkTypeSummary,
            assigns,
        },
    });
});




/* ==============================
   SELLER DASHBOARD TODAY SUMMARY
============================== */
const getTodaySellerDashboardSummary = asyncHandler(async (req, res) => {
    const seller = await Seller.findOne({ userId: req.user._id, isActive: true });

    if (!seller) throw new ApiError(404, "Seller not found");

    const storeID = seller.storeID;
    const today = normalizeDate(new Date());

    // Today stock (cow + buffalo) for this store
    const stockList = await Stock.find({
        storeID,
        date: today,
    });

    // if no stock today
    if (!stockList || stockList.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No stock found for today",
            data: {
                date: today,
                totalAssign: 0,
                sold: 0,
                remaining: 0,
                milkTypeSummary: {},
            },
        });
    }

    // totals
    let totalAssign = 0;
    let sold = 0;
    let remaining = 0;

    const milkTypeSummary = {};

    stockList.forEach((s) => {
        const assignQty = Number(s.sellerTotalAssign || 0);
        const soldQty = Number(s.sellerSoldQty || 0);
        const remainingQty = Number(s.sellerRemainingMilk || 0);

        totalAssign += assignQty;
        sold += soldQty;
        remaining += remainingQty;

        milkTypeSummary[s.milkType] = {
            totalAssign: assignQty,
            sold: soldQty,
            remaining: remainingQty,
        };
    });

    return res.status(200).json({
        success: true,
        message: "Seller dashboard summary fetched",
        data: {
            date: today,
            totalAssign,
            sold,
            remaining,
            milkTypeSummary,
        },
    });
});

module.exports = {
    getTodayMilkAssignForSeller,
    getMilkAssignByDateForSeller,
    getTodaySellerDashboardSummary,
};
