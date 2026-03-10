import { Router, Request, Response } from "express";
import db from "../../utils/db";
import Category from "@/models/Category";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

router.get("/", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await db.connect();
    res.json(await Category.find({}));
  } catch (err) { res.status(500).json({ message: "Error fetching categories" }); }
});

router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await db.connect();
    res.status(201).json(await Category.create(req.body));
  } catch (err) { res.status(500).json({ message: "Error creating category" }); }
});

router.delete("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) { res.status(400).json({ message: "ID required" }); return; }
    await db.connect();
    await Category.findByIdAndDelete(id);
    res.json({ message: "Category deleted" });
  } catch (err) { res.status(500).json({ message: "Error deleting category" }); }
});

export default router;
