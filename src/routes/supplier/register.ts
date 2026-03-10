import { Router, Request, Response } from "express";
import slugify from "slugify";
import db from "../../utils/db";
import User from "@/models/User";
import Supplier from "@/models/Supplier";
import { authenticate } from "../../middleware/auth";

const router = Router();

// POST /api/supplier/register
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { businessName, businessDescription, businessLogo, contactPhone, contactEmail, address, taxId, businessLicense } = req.body;
    if (!businessName || !contactPhone || !contactEmail || !address?.street || !address?.city || !address?.postalCode || !address?.country) {
      res.status(400).json({ message: "Missing required fields" }); return;
    }
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    if (await Supplier.findOne({ user: user._id })) { res.status(400).json({ message: "You already have a supplier account" }); return; }
    if (user.isAdmin) { res.status(400).json({ message: "Admin users cannot register as suppliers" }); return; }
    let businessSlug = slugify(businessName, { lower: true, strict: true });
    if (await Supplier.findOne({ businessSlug })) businessSlug = `${businessSlug}-${Date.now()}`;
    const supplier = await Supplier.create({
      user: user._id, businessName, businessSlug,
      businessDescription: businessDescription || "", businessLogo: businessLogo || "",
      contactPhone, contactEmail,
      address: { street: address.street, city: address.city, postalCode: address.postalCode, country: address.country },
      taxId: taxId || "", businessLicense: businessLicense || "", status: "pending",
    });
    await User.findByIdAndUpdate(user._id, { role: "supplier", supplierId: supplier._id });
    res.status(201).json({ message: "Supplier registration submitted. Pending approval.", supplierId: supplier._id });
  } catch (err) {
    console.error("[POST /api/supplier/register]", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

export default router;
