import { Router, Request, Response } from "express";
import db from "../utils/db";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import Brand from "@/models/Brand";

const router = Router();

// GET /api/categories (public)
router.get("/categories", async (_req: Request, res: Response) => {
  try {
    await db.connect();
    res.json(await Category.find({}));
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories" });
  }
});

// GET /api/subcategories (public)
router.get("/subcategories", async (_req: Request, res: Response) => {
  try {
    await db.connect();
    res.json(await SubCategory.find({}));
  } catch (err) {
    res.status(500).json({ message: "Error fetching subcategories" });
  }
});

// GET /api/brands (public)
router.get("/brands", async (_req: Request, res: Response) => {
  try {
    await db.connect();
    res.json(await Brand.find({}));
  } catch (err) {
    res.status(500).json({ message: "Error fetching brands" });
  }
});

// GET /api/navigation (public)
router.get("/navigation", async (_req: Request, res: Response) => {
  try {
    await db.connect();
    const [categories, subCategories, brands] = await Promise.all([
      Category.find({}),
      SubCategory.find({}),
      Brand.find({}),
    ]);

    const categoryNames = categories.map(c => c.name);
    const brandNames = brands.map(b => b.name);
    
    const categoryMap: Record<string, string[]> = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = subCategories
        .filter(sub => sub.parentCategory === cat.name)
        .map(sub => sub.name);
    });

    res.json({
      categories: categoryNames,
      brands: brandNames,
      categoryMap
    });
  } catch (err) {
    console.error("[GET /api/navigation]", err);
    res.status(500).json({ message: "Error fetching navigation data" });
  }
});

export default router;
