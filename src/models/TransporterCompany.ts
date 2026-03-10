import mongoose, { Schema, Document, Model } from "mongoose";

export type TransporterStatus = "active" | "inactive";

export interface IAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ITransporterCompany extends Document {
  user: mongoose.Types.ObjectId;
  companyName: string;
  companySlug: string;
  description?: string;
  logo?: string;
  phone: string;
  contactEmail: string;
  website?: string;
  trackingUrl?: string;
  address: IAddress;
  coverageAreas?: string[];
  status: TransporterStatus;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const transporterCompanySchema = new Schema<ITransporterCompany>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: { type: String, required: true },
    companySlug: { type: String, required: true, unique: true },
    description: { type: String },
    logo: { type: String },
    phone: { type: String, required: true },
    contactEmail: { type: String, required: true },
    website: { type: String },
    trackingUrl: { type: String },
    address: { type: addressSchema, required: true },
    coverageAreas: [{ type: String }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

const TransporterCompany: Model<ITransporterCompany> =
  mongoose.models.TransporterCompany ||
  mongoose.model<ITransporterCompany>(
    "TransporterCompany",
    transporterCompanySchema,
  );

export default TransporterCompany;
