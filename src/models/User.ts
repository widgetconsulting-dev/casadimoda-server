import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  role: "customer" | "supplier" | "admin" | "transporter";
  supplierId?: mongoose.Types.ObjectId;
  transporterCompanyId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    isAdmin: { type: Boolean, required: true, default: false },

    role: {
      type: String,
      enum: ["customer", "supplier", "admin", "transporter"],
      default: "customer",
    },

    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },

    transporterCompanyId: {
      type: Schema.Types.ObjectId,
      ref: "TransporterCompany",
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
