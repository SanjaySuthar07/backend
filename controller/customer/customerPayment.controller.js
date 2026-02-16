const Customer = require("../../models/Customer.model");
const Payment = require("../../models/Payment.model");

const ApiError = require("../../utils/apiError");
const asyncHandler = require("../../utils/asyncHandle");

/* ==============================
   CUSTOMER: MY PAYMENT HISTORY
============================== */
const getCustomerPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const customer = await Customer.findOne({ userId, isActive: true });
  if (!customer) throw new ApiError(404, "Customer not found");

  const payments = await Payment.find({
    customerId: customer._id,
    storeID: customer.storeID,
  })
    .populate("invoiceId", "invoiceNumber totalAmount paidAmount status periodStart periodEnd")
    .populate("collectedBySellerId", "userId")
    .sort({ paymentDate: -1 });

  return res.status(200).json({
    success: true,
    message: "Customer payment history fetched",
    data: payments,
  });
});

module.exports = {
  getCustomerPaymentHistory,
};
