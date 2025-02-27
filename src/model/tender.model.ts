import mongoose, { Schema, Document, Model } from "mongoose";

export interface TenderDocument extends Document {
  tenderName: string;
  description?: string;
  epublishedDate: string;
  bidSubmissionDate: Date;
  bidOpeningDate: Date;
  tenderValue: number;
  refNo: string;
  TenderId: string;
  district: string;
  state: string;
  department: string;
  subDepartment?: string;
  location?: string;
  address?: string;
  pincode: string;
  active?: boolean;
  industry?: string;
  subIndustry?: string;
  classification?: string;
  EMDAmountin?: string;
  WorkDescription?: string;
  source?: string;
  EMDExemptionAllowed?: string;
}

const tenderSchema: Schema<TenderDocument> = new mongoose.Schema({
  tenderName: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  epublishedDate: {
    type: String,
    required: false,
  },
  bidSubmissionDate: {
    type: Date,
    required: false,
  },
  bidOpeningDate: {
    type: Date,
    required: false,
  },
  tenderValue: {
    type: Number,
    required: false,
  },
  refNo: {
    type: String,
    required: false,
  },
  TenderId: {
    type: String,
    required: false,
  },
  district: {
    type: String,
    required: false,
  },
  state: {
    type: String,
    required: false,
  },
  department: {
    type: String,
    required: false,
  },
  subDepartment: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  pincode: {
    type: String,
    required: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  industry: {
    type: String,
    required: false,
  },
  subIndustry: {
    type: String,
    required: false,
  },
  classification: {
    type: String,
    required: false,
  },
  EMDAmountin: {
    type: String,
    required: false,
  },
  WorkDescription: {
    type: String,
    required: false,
  },
  source: {
    type: String,
    required: false,
  },
  EMDExemptionAllowed: {
    type: String,
    required: false,
  },
});

const Tender: Model<TenderDocument> = mongoose.model<TenderDocument>(
  "Tendernew5",
  tenderSchema
);

export default Tender;
