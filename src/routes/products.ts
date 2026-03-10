import { Router, Request, Response } from "express";
import db from "../utils/db";
import Product from "@/models/Product";

const router = Router();

// GET /api/products
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 12;
    const skip = (page - 1) * pageSize;
    const slug = req.query.slug as string | undefined;
    await db.connect();

    // If slug is provided, return single product
    if (slug) {
      const product = await Product.findOne({ slug }).populate("supplier", "businessName businessSlug").lean();
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.json(product);
      return;
    }

    const sort = req.query.sort as string | undefined;
    const order: Record<string, 1 | -1> =
      sort === "featured" ? { isFeatured: -1 } :
      sort === "lowest" ? { price: 1 } :
      sort === "highest" ? { price: -1 } :
      sort === "toprated" ? { rating: -1 } :
      { createdAt: -1 };

    const filter: any = {
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: { $exists: false } },
        { addedBy: "admin" },
      ],
    };

    if (req.query.isFeatured === "true") {
      filter.isFeatured = true;
    }

    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("supplier", "businessName businessSlug")
      .sort(order)
      .skip(skip)
      .limit(pageSize);
    res.json({ products, totalPages: Math.ceil(totalProducts / pageSize), totalProducts });
  } catch (err) {
    console.error("[GET /api/products]", err);
    res.status(500).json({ message: "Error fetching products" });
  }
});

export default router;
