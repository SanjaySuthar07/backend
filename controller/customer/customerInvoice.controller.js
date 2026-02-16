const Customer = require("../../models/Customer.model");
const Invoice = require("../../models/Invoice.model");
const Payment = require("../../models/Payment.model");
const MilkDelivery = require("../../models/MilkDelivery.model");

const ApiError = require("../../utils/apiError");
const asyncHandler = require("../../utils/asyncHandle");

/* ==============================
   Helper: Month Range
============================== */
const getMonthRange = (year, monthIndex) => {
  const start = new Date(year, monthIndex, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, monthIndex + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/* ==============================
   Helper: Invoice Summary
============================== */
const buildInvoiceData = async ({ invoice, customer }) => {
  const totalAmount = Number(invoice.totalAmount || 0);
  const paidAmount = Number(invoice.paidAmount || 0);

  const dueAmount = Math.max(0, totalAmount - paidAmount);
  const advanceAmount = Math.max(0, paidAmount - totalAmount);

  // payments list
  const payments = await Payment.find({ invoiceId: invoice._id })
    .select("amount paymentMode gateway gatewayStatus paymentDate razorpayPaymentId")
    .sort({ paymentDate: -1 });

  // delivery history for same invoice period
  const deliveries = await MilkDelivery.find({
    customerId: customer._id,
    storeID: customer.storeID,
    date: { $gte: invoice.periodStart, $lte: invoice.periodEnd },
  })
    .select("date milkQty milkType status sellerId createdAt")
    .sort({ date: 1 });

  return {
    invoice,
    deliveries,
    payments,
    summary: {
      totalAmount,
      paidAmount,
      dueAmount,
      advanceAmount,
      status: invoice.status,
    },
  };
};

/* ==============================
   CUSTOMER INVOICE (THIS MONTH)
============================== */
const getCustomerThisMonthInvoice = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const customer = await Customer.findOne({ userId, isActive: true });
  if (!customer) throw new ApiError(404, "Customer not found");

  const now = new Date();
  const { start, end } = getMonthRange(now.getFullYear(), now.getMonth());

  const invoice = await Invoice.findOne({
    customerId: customer._id,
    storeID: customer.storeID,
    periodStart: start,
    periodEnd: end,
  });

  if (!invoice) {
    throw new ApiError(404, "This month invoice not generated yet");
  }

  const data = await buildInvoiceData({ invoice, customer });

  return res.status(200).json({
    success: true,
    message: "This month invoice fetched successfully",
    data,
  });
});

/* ==============================
   CUSTOMER INVOICE (PREVIOUS MONTH)
============================== */
const getCustomerPreviousMonthInvoice = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const customer = await Customer.findOne({ userId, isActive: true });
  if (!customer) throw new ApiError(404, "Customer not found");

  const now = new Date();

  let year = now.getFullYear();
  let monthIndex = now.getMonth() - 1;

  if (monthIndex < 0) {
    monthIndex = 11;
    year = year - 1;
  }

  const { start, end } = getMonthRange(year, monthIndex);

  const invoice = await Invoice.findOne({
    customerId: customer._id,
    storeID: customer.storeID,
    periodStart: start,
    periodEnd: end,
  });

  if (!invoice) {
    throw new ApiError(404, "Previous month invoice not found");
  }

  const data = await buildInvoiceData({ invoice, customer });

  return res.status(200).json({
    success: true,
    message: "Previous month invoice fetched successfully",
    data,
  });
});

module.exports = {
  getCustomerThisMonthInvoice,
  getCustomerPreviousMonthInvoice,
};
