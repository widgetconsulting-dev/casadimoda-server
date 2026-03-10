import { Router, Request, Response } from "express";
import db from "../../utils/db";
import User from "@/models/User";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

// GET /api/admin/users
router.get("/", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await db.connect();
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("[GET /api/admin/users]", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

export default router;
