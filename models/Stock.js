const mongoose = require("mongoose");

const dailyStockSchema = new mongoose.Schema(
  {
    // Kis store ka stock hai
    storeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    // Stock kis date ka hai (sirf ek din ka record)
    // IMPORTANT: is date ko save karte time 00:00:00 normalize karna best rahega
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // Milk type: cow / buffalo
    milkType: {
      type: String,
      enum: ["cow", "buffalo"],
      required: true,
    },

    // ===========================
    // 1) Vendor se total milk aaya
    // ===========================
    totalProcured: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================
    // 2) Owner ne seller ko kitna milk diya
    // =====================================
    sellerTotalAssign: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================================
    // 3) Seller ne customer ko kitna milk deliver/sell kiya
    // ======================================================
    sellerSoldQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // 4) Seller ke paas abhi kitna milk remaining bacha hai
    // (sellerTotalAssign - sellerSoldQty)
    // =====================================================
    sellerRemainingMilk: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // 5) Shop se direct kitna milk bika
    // (seller ke through nahi)
    // ======================================
    directSoldQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===========================
    // 6) Waste milk (spoil / leak)
    // ===========================
    wastage: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================================
    // 7) Closing stock (aaj ka remaining milk)
    //
    // LOGIC:
    // totalProcured - sellerSoldQty - directSoldQty - wastage
    //
    // NOTE:
    // sellerTotalAssign closingStock ko affect nahi karega,
    // kyunki milk assign karne se milk khatam nahi hota.
    // milk tab khatam hota hai jab seller deliver kare.
    // ==========================================================
    closingStock: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// ✅ Ek store + ek date + ek milkType => sirf ek record hona chahiye
dailyStockSchema.index({ storeID: 1, date: 1, milkType: 1 }, { unique: true });

const Stock = mongoose.model("Stock", dailyStockSchema);
module.exports = Stock;
