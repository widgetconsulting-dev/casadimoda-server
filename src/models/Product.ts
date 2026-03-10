import mongoose, { Schema, Document, Model } from "mongoose";

export type ParentCategory = "detail" | "gros";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type AddedBy = "admin" | "supplier";

export interface IColorImage {
  color: string;
  hex: string;
  image: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  category: string;
  subCategory: string;
  brand: string;
  image: string;
  price: number;
  discountPrice?: number;
  countInStock: number;
  description: string;
  rating: number;
  numReviews: number;
  deliveryTime?: string;
  dimensions?: string;
  weight?: string;
  cbm?: number;
  hsCode?: string;
  sizes?: string[];
  colors?: string[];
  colorImages?: IColorImage[];
  parentCategory: ParentCategory;
  isFeatured: boolean;
  supplier?: mongoose.Types.ObjectId;
  approvalStatus: ApprovalStatus;
  approvalNote?: string;
  addedBy: AddedBy;
  createdAt: Date;
  updatedAt: Date;
}

const colorImageSchema = new Schema<IColorImage>(
  {
    color: { type: String },
    hex: { type: String },
    image: { type: String },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    brand: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    discountPrice: { type: Number, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
    description: { type: String, required: true },
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    deliveryTime: { type: String },
    dimensions: { type: String },
    weight: { type: String },
    cbm: { type: Number },
    hsCode: { type: String },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    colorImages: [colorImageSchema],
    parentCategory: {
      type: String,
      enum: ["detail", "gros"],
      default: "detail",
    },
    isFeatured: { type: Boolean, default: false },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    approvalNote: { type: String },
    addedBy: {
      type: String,
      enum: ["admin", "supplier"],
      default: "admin",
    },
  },
  { timestamps: true },
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);

export default Product;
