import mongoose, { Schema, Document, Model } from "mongoose";

export type SupplierStatus = "pending" | "approved" | "rejected" | "suspended";

export interface IAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ISupplier extends Document {
  user: mongoose.Types.ObjectId;
  businessName: string;
  businessSlug: string;
  businessDescription?: string;
  businessLogo?: string;
  businessBanner?: string;
  contactPhone: string;
  contactEmail: string;
  address: IAddress;
  taxId?: string;
  businessLicense?: string;
  status: SupplierStatus;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  commissionRate: number;
  totalSales: number;
  totalProducts: number;
  rating: number;
  numReviews: number;
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

const supplierSchema = new Schema<ISupplier>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    businessName: { type: String, required: true },
    businessSlug: { type: String, required: true, unique: true },
    businessDescription: { type: String },
    businessLogo: { type: String },
    businessBanner: { type: String },

    contactPhone: { type: String, required: true },
    contactEmail: { type: String, required: true },

    address: { type: addressSchema, required: true },

    taxId: { type: String },
    businessLicense: { type: String },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },

    commissionRate: { type: Number, default: 15 },

    totalSales: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplier>("Supplier", supplierSchema);

export default Supplier;
