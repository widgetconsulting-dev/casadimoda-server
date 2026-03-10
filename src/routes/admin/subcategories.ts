import { Router, Request, Response } from "express";
import slugify from "slugify";
import db from "../../utils/db";
import SubCategory from "@/models/SubCategory";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

router.get("/", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await db.connect();
    res.json(await SubCategory.find({}));
  } catch (err) { res.status(500).json({ message: "Error fetching subcategories" }); }
});

router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, parentCategory, description } = req.body;
    await db.connect();
    const sub = await SubCategory.create({ name, slug: slugify(name, { lower: true }), parentCategory, description });
    res.status(201).json(sub);
  } catch (err) { res.status(500).json({ message: "Error creating subcategory" }); }
});

router.put("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, name, slug, parentCategory, description } = req.body;
    if (!id) { res.status(400).json({ message: "ID required" }); return; }
    await db.connect();
    const updated = await SubCategory.findByIdAndUpdate(
      id,
      { name, slug: slug || slugify(name, { lower: true }), parentCategory, description },
      { new: true }
    );
    res.json(updated);
  } catch (err) { res.status(500).json({ message: "Error updating subcategory" }); }
});

router.delete("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) { res.status(400).json({ message: "ID required" }); return; }
    await db.connect();
    await SubCategory.findByIdAndDelete(id);
    res.json({ message: "SubCategory deleted" });
  } catch (err) { res.status(500).json({ message: "Error deleting subcategory" }); }
});

export default router;
