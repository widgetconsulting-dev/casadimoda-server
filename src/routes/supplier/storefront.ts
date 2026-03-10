import { Router, Request, Response } from "express";
import db from "../../utils/db";
import Supplier from "@/models/Supplier";
import Product from "@/models/Product";

const router = Router();

// GET /api/supplier/storefront/:slug - public endpoint for supplier storefront
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    await db.connect();
    const { slug } = req.params;

    const supplier = await Supplier.findOne({
      businessSlug: slug,
      status: "approved",
    }).lean();

    if (!supplier) {
      res.status(404).json({ message: "Supplier not found" });
      return;
    }

    const products = await Product.find({
      supplier: supplier._id,
      approvalStatus: "approved",
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ supplier, products });
  } catch (err) {
    console.error("[GET /api/supplier/storefront/:slug]", err);
    res.status(500).json({ message: "Error fetching supplier storefront" });
  }
});

export default router;
