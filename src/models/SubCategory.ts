import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubCategory extends Document {
  name: string;
  slug: string;
  parentCategory: string;
  description?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subCategorySchema = new Schema<ISubCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parentCategory: { type: String, required: true },
    description: { type: String },
    image: { type: String },
  },
  { timestamps: true },
);

const SubCategory: Model<ISubCategory> =
  mongoose.models.SubCategory ||
  mongoose.model<ISubCategory>("SubCategory", subCategorySchema);

export default SubCategory;
