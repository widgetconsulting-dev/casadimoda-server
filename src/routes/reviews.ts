import { Router, Request, Response } from "express";
import db from "../utils/db";
import Review from "@/models/Review";
import Product from "@/models/Product";
import User from "@/models/User";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/reviews?productId=xxx — fetch reviews for a product
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.query.productId as string;
    if (!productId) {
       res.status(400).json({ message: "productId required" });
       return;
    }

    await db.connect();
    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reviews });
  } catch (err) {
    console.error("[GET /api/reviews]", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/reviews — submit or update a rating
router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.user!.email;
    const { productId, rating, comment } = req.body;
    
    if (!productId || !rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Invalid data" });
      return;
    }

    await db.connect();

    const user = await User.findOne({ email }).select("_id");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Upsert review
    await Review.findOneAndUpdate(
      { user: user._id, product: productId },
      { user: user._id, product: productId, rating, comment },
      { upsert: true, new: true }
    );

    // Recalculate product rating
    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      product.rating = Math.round(stats[0].avg * 10) / 10;
      product.numReviews = stats[0].count;
      await product.save();
    }

    res.json({
      rating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
