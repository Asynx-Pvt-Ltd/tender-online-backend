import mongoose from "mongoose";
const deletedUserSchema = new mongoose.Schema(
  {
    originalId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    isPayment: {
      type: Boolean,
      default: false,
    },
    subscriptionValidity: {
      type: String,
    },
    companyName: {
      type: String,
    },
    paymentStatus: {
      type: String,
    },
    clientId: {
      type: String,
    },
    improvement: {
      type: [String], // Allow an array of strings
      default: [],
    },

    deletedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const DeletedUser = mongoose.model("DeletedUser", deletedUserSchema);

module.exports = DeletedUser;

export default DeletedUser;
