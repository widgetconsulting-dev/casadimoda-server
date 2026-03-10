import { Router, Request, Response } from "express";
import db from "../../utils/db";
import Brand from "@/models/Brand";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

router.get("/", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await db.connect();
    res.json(await Brand.find({}));
  } catch (err) { res.status(500).json({ message: "Error fetching brands" }); }
});

router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await db.connect();
    res.status(201).json(await Brand.create(req.body));
  } catch (err) { res.status(500).json({ message: "Error creating brand" }); }
});

router.delete("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) { res.status(400).json({ message: "ID required" }); return; }
    await db.connect();
    await Brand.findByIdAndDelete(id);
    res.json({ message: "Brand deleted" });
  } catch (err) { res.status(500).json({ message: "Error deleting brand" }); }
});

export default router;
