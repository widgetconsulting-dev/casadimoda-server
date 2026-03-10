import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGiftCard extends Document {
  code: string;
  amount: number;
  balance: number;
  expiryDate?: Date;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const giftCardSchema = new Schema<IGiftCard>(
  {
    code: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    balance: { type: Number, required: true },
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const GiftCard: Model<IGiftCard> =
  mongoose.models.GiftCard ||
  mongoose.model<IGiftCard>("GiftCard", giftCardSchema);

export default GiftCard;
