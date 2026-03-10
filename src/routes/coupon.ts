import { Router, Request, Response } from "express";
import db from "../utils/db";
import Coupon from "../models/Coupon";

const router = Router();

// POST /api/coupon
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      res.status(400).json({ message: "Code required" });
      return;
    }

    await db.connect();
    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
    
    if (!coupon) {
      res.status(404).json({ message: "Invalid or inactive coupon" });
      return;
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      res.status(400).json({ message: "Coupon has expired" });
      return;
    }

    if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
      res.status(400).json({ message: "Coupon usage limit reached" });
      return;
    }

    const discount =
      coupon.type === "percentage"
        ? Math.round((subtotal * coupon.discount) / 100)
        : coupon.discount;

    res.json({
      code: coupon.code,
      type: coupon.type,
      discount: coupon.discount,
      discountAmount: Math.min(discount, subtotal),
    });
  } catch (err) {
    console.error("[POST /api/coupon]", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
