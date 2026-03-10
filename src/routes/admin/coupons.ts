import { Router, Request, Response } from "express";
import db from "../../utils/db";
import Coupon from "@/models/Coupon";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

router.get("/", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await db.connect();
    res.json(await Coupon.find({}));
  } catch (err) { res.status(500).json({ message: "Error fetching coupons" }); }
});

router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await db.connect();
    res.status(201).json(await Coupon.create(req.body));
  } catch (err) { res.status(500).json({ message: "Error creating coupon" }); }
});

router.delete("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) { res.status(400).json({ message: "ID required" }); return; }
    await db.connect();
    await Coupon.findByIdAndDelete(id);
    res.json({ message: "Coupon deleted" });
  } catch (err) { res.status(500).json({ message: "Error deleting coupon" }); }
});

export default router;
