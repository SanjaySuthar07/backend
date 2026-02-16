require("dotenv").config();

const User = require("../../../models/User.model");
const Store = require("../../../models/Store.model");
const SubscriptionPlan = require("../../../models/SubscriptionPlan.model");
const SubscriptionHistory = require("../../../models/SubscriptionHistory"); // Naya model import karein
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: "rzp_test_S9ZwbzJa3dGU4k",
    key_secret: "oICN0DhGn2sn5wg4e9inbwaE"
});

const createRazorpayOrder = async (req, res) => {
    try {
        const { planId } = req.body;

        const plan = await SubscriptionPlan.findOne({
            _id: planId,
            isActive: true
        });

        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        const options = {
            amount: plan.price * 100,
            currency: "INR",
            receipt: `plan_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order,
            plan: {
                id: plan._id,
                name: plan.name,
                price: plan.price
            }
        });

    } catch (error) {
        console.error("🔥 CONTROLLER ERROR:", error);

        res.status(500).json({
            message: error.message,
            name: error.name,
            stack: error.stack
        });
    }
};

const verifyAndActivateStore = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planId,
            shopName,
            shopAddress,
            contactNumber
        } = req.body;

        // 1. Signature Verification (Ise hamesha prod mein enable rakhein)
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", "oICN0DhGn2sn5wg4e9inbwaE") // Apni secret key use karein
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        // 2. Check Plan
        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        // 3. Create or Update Store
        // Hum 'upsert' logic use kar rahe hain taaki agar owner plan renew kare toh naya store na bane
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + plan.duration);

        const store = await Store.findOneAndUpdate(
            { userId: req.user._id },
            {
                shopName,
                shopAddress,
                contactNumber,
                planId: plan._id,
                planExpiresAt: expiryDate, // Store model mein naya field
                isActive: true,
                isSuspended: false
            },
            { new: true, upsert: true }
        );

        // 4. Save to Subscription History (Yahan sara payment data jayega)
        await SubscriptionHistory.create({
            storeID: store._id,
            planId: plan._id,
            amountPaid: plan.price,
            paymentStatus: "completed",
            startDate: new Date(),
            endDate: expiryDate,
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            planSnapshot: {
                name: plan.name,
                maxCustomers: plan.maxCustomers,
                maxSellers: plan.maxSellers
            }
        });

        // 5. Upgrade User Role to Owner
        await User.findByIdAndUpdate(req.user._id, {
            role: "owner" // Aapke enum mein 'Owner' capital ho sakta hai, check kar lein
        });

        res.status(201).json({
            success: true,
            message: "Store activated and subscription recorded!",
            store
        });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ message: error.message });
    }
};
module.exports = {
    createRazorpayOrder,
    verifyAndActivateStore
}