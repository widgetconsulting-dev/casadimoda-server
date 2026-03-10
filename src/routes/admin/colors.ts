import { Router, Request, Response } from "express";
import db from "../../utils/db";
import Color from "@/models/Color";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

router.get("/", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await db.connect();
    res.json(JSON.parse(JSON.stringify(await Color.find({}).sort({ name: 1 }).lean())));
  } catch (err) { res.status(500).json({ message: "Error fetching colors" }); }
});

router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, hex } = req.body;
    if (!name || !hex) { res.status(400).json({ message: "name and hex are required" }); return; }
    await db.connect();
    const color = await Color.create({ name: name.trim(), hex: hex.trim() });
    res.status(201).json(JSON.parse(JSON.stringify(color)));
  } catch (err) { res.status(500).json({ message: "Error creating color" }); }
});

router.put("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, name, hex } = req.body;
    if (!id) { res.status(400).json({ message: "id required" }); return; }
    await db.connect();
    const color = await Color.findByIdAndUpdate(id, { name: name?.trim(), hex: hex?.trim() }, { new: true });
    res.json(JSON.parse(JSON.stringify(color)));
  } catch (err) { res.status(500).json({ message: "Error updating color" }); }
});

router.delete("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) { res.status(400).json({ message: "id required" }); return; }
    await db.connect();
    await Color.findByIdAndDelete(id);
    res.json({ message: "Color deleted" });
  } catch (err) { res.status(500).json({ message: "Error deleting color" }); }
});

export default router;
