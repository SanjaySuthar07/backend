const mongoose = require("mongoose");

const JoinRequest = require("../../models/JoinRequest.model");
const Store = require("../../models/Store.model");
const User = require("../../models/User.model");
const Customer = require("../../models/Customer.model");
const Seller = require("../../models/Seller.model");

const ApiError = require("../../utils/apiError");
const asyncHandler = require("../../utils/asyncHandle");

/* ==============================
   CREATE JOIN REQUEST (USER)
   POST /api/store/join-request
============================== */
const createJoinRequest = asyncHandler(async (req, res) => {
  const requesterId = req.user?._id;
  if (!requesterId) throw new ApiError(401, "Unauthorized");

  const { storeID, roleRequested, message } = req.body;

  if (!storeID) throw new ApiError(400, "storeID is required");
  if (!roleRequested) throw new ApiError(400, "roleRequested is required");

  if (!["seller", "customer"].includes(roleRequested)) {
    throw new ApiError(400, "Invalid roleRequested");
  }

  const store = await Store.findById(storeID).select("userId isActive isSuspended");
  if (!store) throw new ApiError(404, "Store not found");

  if (store.isActive !== true || store.isSuspended === true) {
    throw new ApiError(400, "This store is not active");
  }

  const ownerId = store.userId;

  // ✅ prevent duplicate pending request
  const existing = await JoinRequest.findOne({
    requesterId,
    storeID,
    roleRequested,
    status: "pending",
  });

  if (existing) {
    throw new ApiError(400, "You already have a pending request for this store");
  }

  const reqDoc = await JoinRequest.create({
    requesterId,
    storeID,
    ownerId,
    roleRequested,
    message: message || "",
    status: "pending",
  });

  return res.status(201).json({
    success: true,
    message: "Join request sent successfully",
    data: reqDoc,
  });
});

/* ==============================
   GET MY JOIN REQUESTS (USER)
   GET /api/store/join-request/my
============================== */
const getMyJoinRequests = asyncHandler(async (req, res) => {
  const requesterId = req.user?._id;
  if (!requesterId) throw new ApiError(401, "Unauthorized");

  const requests = await JoinRequest.find({ requesterId })
    .populate("storeID", "shopName")
    .select("storeID roleRequested status message createdAt processedAt")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: "My join requests fetched",
    data: requests,
  });
});

/* ==============================
   OWNER: GET ALL JOIN REQUESTS
   GET /api/store/join-request/owner
============================== */
const getOwnerJoinRequests = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  if (!ownerId) throw new ApiError(401, "Unauthorized");

  const requests = await JoinRequest.find({ ownerId })
    .populate("requesterId", "name mobile role")
    .populate("storeID", "shopName")
    .select("requesterId storeID roleRequested status message createdAt processedAt")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: "Owner join requests fetched",
    data: requests,
  });
});

/* ==============================
   OWNER: APPROVE / REJECT
   PATCH /api/store/join-request/:id
============================== */
const processJoinRequest = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  if (!ownerId) throw new ApiError(401, "Unauthorized");

  const { id } = req.params;
  const { action } = req.body; // approve / reject

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid request id");
  }

  if (!["approve", "reject"].includes(action)) {
    throw new ApiError(400, "action must be approve or reject");
  }

  const request = await JoinRequest.findById(id);
  if (!request) throw new ApiError(404, "Join request not found");

  if (String(request.ownerId) !== String(ownerId)) {
    throw new ApiError(403, "Not allowed");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Request already processed");
  }

  // ----------------------------
  // REJECT
  // ----------------------------
  if (action === "reject") {
    request.status = "rejected";
    request.processedAt = new Date();
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Request rejected",
      data: request,
    });
  }

  // ----------------------------
  // APPROVE
  // ----------------------------
  const user = await User.findById(request.requesterId);
  if (!user) throw new ApiError(404, "User not found");

  // roleRequested = customer
  if (request.roleRequested === "customer") {
    // already customer?
    const alreadyCustomer = await Customer.findOne({
      userId: user._id,
      storeID: request.storeID,
    });

    if (!alreadyCustomer) {
      await Customer.create({
        userId: user._id,
        storeID: request.storeID,

        // ⚠️ This data should come later from owner form
        addressId: null,
        fullAddress: "Pending",
        milkType: "cow",
        dailyQty: 1,
        ratePerLiter: 0,
        billingStartDate: new Date(),
      });
    }

    user.role = "customer";
    await user.save();
  }

  // roleRequested = seller
  if (request.roleRequested === "seller") {
    const alreadySeller = await Seller.findOne({
      userId: user._id,
      storeID: request.storeID,
    });

    if (!alreadySeller) {
      await Seller.create({
        userId: user._id,
        storeID: request.storeID,
        assignedAreaIds: [],
      });
    }

    user.role = "seller";
    await user.save();
  }

  request.status = "approved";
  request.processedAt = new Date();
  await request.save();

  return res.status(200).json({
    success: true,
    message: "Request approved successfully",
    data: request,
  });
});

module.exports = {
  createJoinRequest,
  getMyJoinRequests,
  getOwnerJoinRequests,
  processJoinRequest,
};
