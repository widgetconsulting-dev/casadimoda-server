import { Router, Request, Response } from "express";
import db from "../utils/db";
import Product from "@/models/Product";

const router = Router();

// GET /api/search
router.get("/", async (req: Request, res: Response) => {
  try {
    await db.connect();
    const query = (req.query.q as string) || "";
    const category = (req.query.category as string) || "";
    const subCategory = (req.query.subCategory as string) || "";
    const brand = (req.query.brand as string) || "";
    const supplier = (req.query.supplier as string) || "";
    const price = (req.query.price as string) || "";
    const rating = (req.query.rating as string) || "";
    const sort = (req.query.sort as string) || "newest";
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 12;

    const approvalFilter = {
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: { $exists: false } },
        { addedBy: "admin" },
      ],
    };

    const filter: Record<string, unknown> = {
      ...approvalFilter,
      ...(query && query !== "all" ? { name: { $regex: query, $options: "i" } } : {}),
      ...(category && category !== "all" ? { category } : {}),
      ...(subCategory && subCategory !== "all" ? { subCategory } : {}),
      ...(brand && brand !== "all" ? { brand } : {}),
      ...(supplier && supplier !== "all" ? { supplier } : {}),
      ...(rating && rating !== "all" ? { rating: { $gte: Number(rating) } } : {}),
      ...(price && price !== "all"
        ? { price: { $gte: Number(price.split("-")[0]), $lte: Number(price.split("-")[1]) } }
        : {}),
    };

    const order: Record<string, 1 | -1> =
      sort === "lowest" ? { price: 1 } :
      sort === "highest" ? { price: -1 } :
      sort === "toprated" ? { rating: -1 } :
      sort === "featured" ? { isFeatured: -1 } :
      { createdAt: -1 };

    const [products, countProducts, categories, brands] = await Promise.all([
      Product.find(filter).populate("supplier", "businessName businessSlug").sort(order).skip(pageSize * (page - 1)).limit(pageSize).lean(),
      Product.countDocuments(filter),
      Product.find(approvalFilter).distinct("category"),
      Product.find(approvalFilter).distinct("brand"),
    ]);

    res.json({ products, countProducts, page, pages: Math.ceil(countProducts / pageSize), categories, brands });
  } catch (err) {
    console.error("[GET /api/search]", err);
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;
