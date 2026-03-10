import { Router, Request, Response } from "express";
import db from "../utils/db";
import User from "@/models/User";
import Product from "@/models/Product";
import Wishlist from "@/models/Wishlist";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/wishlist  or  GET /api/wishlist?productId=xxx
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    await db.connect();
    const user = await User.findOne({ email: req.user!.email }).select("_id");
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    const productId = req.query.productId as string;
    if (productId) {
      const item = await Wishlist.findOne({ user: user._id, product: productId });
      res.json({ isWishlisted: !!item });
      return;
    }
    const items = await Wishlist.find({ user: user._id })
      .populate("product", "name slug image price discountPrice brand")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: JSON.parse(JSON.stringify(items)) });
  } catch (err) {
    console.error("[GET /api/wishlist]", err);
    res.status(500).json({ message: "Error fetching wishlist" });
  }
});

// POST /api/wishlist
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) { res.status(400).json({ message: "productId required" }); return; }
    await db.connect();
    const [user, product] = await Promise.all([
      User.findOne({ email: req.user!.email }).select("_id"),
      Product.findById(productId).select("_id"),
    ]);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    if (!product) { res.status(404).json({ message: "Product not found" }); return; }
    await Wishlist.findOneAndUpdate(
      { user: user._id, product: productId },
      { user: user._id, product: productId },
      { upsert: true }
    );
    res.json({ isWishlisted: true });
  } catch (err) {
    console.error("[POST /api/wishlist]", err);
    res.status(500).json({ message: "Error updating wishlist" });
  }
});

// DELETE /api/wishlist
router.delete("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) { res.status(400).json({ message: "productId required" }); return; }
    await db.connect();
    const user = await User.findOne({ email: req.user!.email }).select("_id");
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    await Wishlist.deleteOne({ user: user._id, product: productId });
    res.json({ isWishlisted: false });
  } catch (err) {
    console.error("[DELETE /api/wishlist]", err);
    res.status(500).json({ message: "Error updating wishlist" });
  }
});

export default router;
