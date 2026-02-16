const Seller = require("../../models/Seller.model");
const Customer = require("../../models/Customer.model");
const Invoice = require("../../models/Invoice.model");
const Payment = require("../../models/Payment.model");

const ApiError = require("../../utils/apiError");
const asyncHandler = require("../../utils/asyncHandle");

/* ==============================
   SELLER CREATE MANUAL PAYMENT (ADVANCE SUPPORT)
============================== */
const sellerCreateManualPayment = asyncHandler(async (req, res) => {
  const { customerId, invoiceId, amount, paymentMode } = req.body;

  if (!customerId || !invoiceId || !amount || !paymentMode) {
    throw new ApiError(400, "Required fields missing");
  }

  const payAmount = Number(amount);
  if (payAmount <= 0) throw new ApiError(400, "Amount must be > 0");

  if (!["cash", "upi", "bank"].includes(paymentMode)) {
    throw new ApiError(400, "Invalid payment mode");
  }

  // 1) seller find
  const seller = await Seller.findOne({ userId: req.user._id, isActive: true });
  if (!seller) throw new ApiError(404, "Seller not found");

  const storeID = seller.storeID;

  // 2) customer validate
  const customer = await Customer.findOne({
    _id: customerId,
    storeID,
    isActive: true,
  });

  if (!customer) throw new ApiError(404, "Customer not found");

  // 3) invoice validate
  const invoice = await Invoice.findOne({
    _id: invoiceId,
    storeID,
    customerId: customer._id,
  });

  if (!invoice) throw new ApiError(404, "Invoice not found");

  // ❗ invoice already paid
  // still allowed because customer may want to pay advance
  // but we will store it in advanceBalance

  const invoiceTotal = Number(invoice.totalAmount || 0);
  const invoicePaid = Number(invoice.paidAmount || 0);
  const invoiceDue = Math.max(0, invoiceTotal - invoicePaid);

  // 4) calculate how much goes to invoice & how much to advance
  const payToInvoice = Math.min(payAmount, invoiceDue);
  const extraAdvance = Math.max(0, payAmount - invoiceDue);

  // 5) create payment entry
  const payment = await Payment.create({
    storeID,
    invoiceId: invoice._id,
    customerId: customer._id,
    amount: payAmount,
    paymentMode,
    gateway: paymentMode,
    gatewayStatus: "captured",
    paymentDate: new Date(),

    collectedBySellerId: seller._id, // IMPORTANT (add this in schema)
  });

  // 6) update invoice (only payToInvoice)
  invoice.paidAmount = invoicePaid + payToInvoice;

  if (invoice.paidAmount >= invoice.totalAmount) {
    invoice.status = "paid";
    invoice.paidAmount = invoice.totalAmount; // safety
  } else if (invoice.paidAmount > 0) {
    invoice.status = "partial";
  } else {
    invoice.status = "unpaid";
  }

  await invoice.save();

  // 7) update customer advanceBalance (extraAdvance)
  if (extraAdvance > 0) {
    customer.advanceBalance = Number(customer.advanceBalance || 0) + extraAdvance;
    await customer.save();
  }

  return res.status(201).json({
    success: true,
    message: "Payment added successfully",
    data: {
      payment,
      invoice,
      invoiceDueBefore: invoiceDue,
      payToInvoice,
      extraAdvance,
      customerAdvanceBalance: customer.advanceBalance,
    },
  });
});
const getSellerTodayCollections = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ userId: req.user._id, isActive: true });
  if (!seller) throw new ApiError(404, "Seller not found");

  const storeID = seller.storeID;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const payments = await Payment.find({
    storeID,
    collectedBySellerId: seller._id,
    paymentDate: { $gte: start, $lte: end },
  })
    .populate("customerId", "userId fullAddress milkType dailyQty")
    .populate({
      path: "customerId",
      populate: { path: "userId", select: "name mobile profileImage" },
    })
    .populate("invoiceId", "invoiceNumber totalAmount paidAmount status")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: "Today collections fetched",
    data: payments,
  });
});

module.exports = {
  sellerCreateManualPayment,
  getSellerTodayCollections,
};