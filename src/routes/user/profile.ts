import { Router, Request, Response } from "express";
import bcryptjs from "bcryptjs";
import db from "../../utils/db";
import User from "@/models/User";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    await db.connect();
    const user = await User.findOne({ email: req.user!.email }).select("-password");
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    res.json({ _id: user._id.toString(), name: user.name, email: user.email, isAdmin: user.isAdmin, role: user.role, createdAt: user.createdAt?.toString() });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

router.put("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    if (name) user.name = name;
    if (newPassword) {
      if (!currentPassword) { res.status(400).json({ message: "Current password is required" }); return; }
      if (!bcryptjs.compareSync(currentPassword, user.password)) { res.status(400).json({ message: "Current password is incorrect" }); return; }
      user.password = bcryptjs.hashSync(newPassword, 10);
    }
    await user.save();
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
});

export default router;
