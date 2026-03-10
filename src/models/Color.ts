import mongoose, { Schema, Document, Model } from "mongoose";

export interface IColor extends Document {
  name: string;
  hex: string;
  createdAt: Date;
  updatedAt: Date;
}

const colorSchema = new Schema<IColor>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    hex: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const Color: Model<IColor> =
  mongoose.models.Color || mongoose.model<IColor>("Color", colorSchema);

export default Color;
