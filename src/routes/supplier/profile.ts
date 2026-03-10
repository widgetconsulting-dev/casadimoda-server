import { Router, Request, Response } from "express";
import db from "../../utils/db";
import User from "@/models/User";
import Supplier from "@/models/Supplier";
import { authenticate } from "../../middleware/auth";
import { requireSupplier } from "../../middleware/requireRole";

const router = Router();

// GET /api/supplier/profile
router.get("/", authenticate, requireSupplier, async (req: Request, res: Response) => {
  try {
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user?.supplierId) { res.status(404).json({ message: "Supplier profile not found" }); return; }
    const supplier = await Supplier.findById(user.supplierId);
    if (!supplier) { res.status(404).json({ message: "Supplier profile not found" }); return; }
    res.json(supplier);
  } catch (err) {
    console.error("[GET /api/supplier/profile]", err);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// PUT /api/supplier/profile
router.put("/", authenticate, requireSupplier, async (req: Request, res: Response) => {
  try {
    const { businessDescription, businessLogo, businessBanner, contactPhone, contactEmail } = req.body;
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user?.supplierId) { res.status(404).json({ message: "Supplier profile not found" }); return; }
    const allowedUpdates: Record<string, unknown> = {};
    if (businessDescription !== undefined) allowedUpdates.businessDescription = businessDescription;
    if (businessLogo !== undefined) allowedUpdates.businessLogo = businessLogo;
    if (businessBanner !== undefined) allowedUpdates.businessBanner = businessBanner;
    if (contactPhone !== undefined) allowedUpdates.contactPhone = contactPhone;
    if (contactEmail !== undefined) allowedUpdates.contactEmail = contactEmail;
    const supplier = await Supplier.findByIdAndUpdate(user.supplierId, allowedUpdates, { new: true });
    res.json(supplier);
  } catch (err) {
    console.error("[PUT /api/supplier/profile]", err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

export default router;
