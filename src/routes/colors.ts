import { Router, Request, Response } from "express";
import db from "../utils/db";
import Color from "@/models/Color";

const router = Router();

// GET /api/colors  (public)
router.get("/", async (_req: Request, res: Response) => {
  try {
    await db.connect();
    const colors = await Color.find({}).sort({ name: 1 }).lean();
    res.json(JSON.parse(JSON.stringify(colors)));
  } catch (err) {
    console.error("[GET /api/colors]", err);
    res.status(500).json({ message: "Error fetching colors" });
  }
});

export default router;
