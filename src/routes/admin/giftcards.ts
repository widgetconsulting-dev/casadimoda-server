import { Router, Request, Response } from "express";
import db from "../../utils/db";
import GiftCard from "@/models/GiftCard";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

router.get("/", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await db.connect();
    res.json(await GiftCard.find({}));
  } catch (err) { res.status(500).json({ message: "Error fetching gift cards" }); }
});

router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await db.connect();
    res.status(201).json(await GiftCard.create(req.body));
  } catch (err) { res.status(500).json({ message: "Error creating gift card" }); }
});

export default router;
