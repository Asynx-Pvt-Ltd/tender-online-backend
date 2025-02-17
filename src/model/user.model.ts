const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    clientId: { type: String, required: false },
    phone: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    companyName: { type: String, required: false, default: "" },
    state: { type: Array, default: ["tamil-nadu"] },

    // Payment and Subscription Fields
    isPayment: { type: Boolean, default: false },
    paymentStatus: { type: String, default: "Pending" },
    subscriptionValidity: { type: Date, required: false },

    // New Subscription-specific Fields
    currentSubscriptionId: { type: String, required: false },
    currentSubscriptionPlanId: { type: String, required: false },
    subscriptionAmount: { type: Number, required: false },
    lastSubscriptionDate: { type: Date, required: false },

    // Subscription History
    subscriptionHistory: [
      {
        subscriptionId: { type: String, required: true },
        planId: { type: String, required: true },
        amount: { type: Number, required: true },
        duration: { type: String, required: true },
        subscriptionDate: { type: Date, required: true },
        validUntil: { type: Date, required: true },
      },
    ],

    // Existing Fields
    city: { type: String, required: false },
    address: { type: String, required: false },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "free"],
      default: "active",
    },
    industry: { type: Array, required: false },
    classification: { type: Array, required: false },
    freeTrailTime: { type: Date, default: new Date() },
    notificationSent: { type: Boolean, default: false },
    profile_image: { type: String, required: false },
    isGoogleAuth: { type: Boolean, default: false },
    keyword: { type: Array, required: false },
    improvement: { type: [String], required: false, default: [] },
  },
  {
    timestamps: true,
  }
);

// Optional: Add a method to check subscription status
userSchema.methods.isSubscriptionActive = function () {
  return this.subscriptionValidity && this.subscriptionValidity > new Date();
};

// Optional: Add a method to get current active subscription
userSchema.methods.getCurrentSubscription = function () {
  if (!this.isSubscriptionActive()) return null;

  return {
    planId: this.currentSubscriptionPlanId,
    validUntil: this.subscriptionValidity,
    amount: this.subscriptionAmount,
  };
};

const User = mongoose.model("tender-user", userSchema);
module.exports = User;
