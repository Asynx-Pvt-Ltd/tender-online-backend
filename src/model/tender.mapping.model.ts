import mongoose, { Document, Schema } from "mongoose";

interface ITenderMapping extends Document {
  tenderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string; // Add type field to distinguish between different mapping types
  status: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const TenderMappingSchema: Schema = new Schema(
  {
    tenderId: {
      type: mongoose.Types.ObjectId,
      ref: "Tendernew5",
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "tender-user",
      required: true,
    },
    type: {
      type: String,
      enum: ["request", "saved", "viewed"],
      default: "request",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "saved"],
      default: "pending",
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Add a compound index to ensure a user can't save the same tender multiple times
TenderMappingSchema.index(
  { userId: 1, tenderId: 1, type: 1 },
  { unique: true }
);

const TenderMapping = mongoose.model<ITenderMapping>(
  "TenderMapping",
  TenderMappingSchema
);

export default TenderMapping;
