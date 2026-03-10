import { Router, Request, Response } from "express";
import db from "../utils/db";
import GiftCard from "../models/GiftCard";

const router = Router();

// POST /api/giftcard
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ message: "Code required" });
      return;
    }

    await db.connect();
    const card = await GiftCard.findOne({ code: code.trim().toUpperCase(), isActive: true });
    
    if (!card) {
      res.status(404).json({ message: "Invalid or inactive gift card" });
      return;
    }

    if (card.expiryDate && new Date(card.expiryDate) < new Date()) {
      res.status(400).json({ message: "Gift card has expired" });
      return;
    }

    if (card.balance <= 0) {
      res.status(400).json({ message: "Gift card has no remaining balance" });
      return;
    }

    res.json({
      code: card.code,
      balance: card.balance,
    });
  } catch (err) {
    console.error("[POST /api/giftcard]", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
