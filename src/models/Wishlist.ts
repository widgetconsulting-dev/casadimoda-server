import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true },
);

// Prevent duplicate entries
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist ||
  mongoose.model<IWishlist>("Wishlist", wishlistSchema);

export default Wishlist;
