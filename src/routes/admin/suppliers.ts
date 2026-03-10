import { Router, Request, Response } from "express";
import db from "../../utils/db";
import Supplier from "@/models/Supplier";
import User from "@/models/User";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

// GET /api/admin/suppliers
router.get("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = 10;
    const status = (req.query.status as string) || "";
    const search = (req.query.search as string) || "";
    await db.connect();
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (search) filter.$or = [{ businessName: { $regex: search, $options: "i" } }, { contactEmail: { $regex: search, $options: "i" } }];
    const total = await Supplier.countDocuments(filter);
    const suppliers = await Supplier.find(filter).populate("user", "name email").sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize);
    res.json({ suppliers, totalPages: Math.ceil(total / pageSize), totalSuppliers: total, currentPage: page });
  } catch (err) {
    console.error("[GET /api/admin/suppliers]", err);
    res.status(500).json({ message: "Error fetching suppliers" });
  }
});

// PUT /api/admin/suppliers
router.put("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, status, rejectionReason, commissionRate } = req.body;
    if (!id) { res.status(400).json({ message: "Supplier ID required" }); return; }
    await db.connect();
    const adminUser = await User.findOne({ email: req.user!.email });
    const supplier = await Supplier.findById(id);
    if (!supplier) { res.status(404).json({ message: "Supplier not found" }); return; }
    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === "approved") { updateData.approvedAt = new Date(); updateData.approvedBy = adminUser!._id; updateData.rejectionReason = ""; }
      else if (status === "rejected") { updateData.rejectionReason = rejectionReason || ""; }
    }
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    const updated = await Supplier.findByIdAndUpdate(id, updateData, { new: true }).populate("user", "name email");
    res.json(updated);
  } catch (err) {
    console.error("[PUT /api/admin/suppliers]", err);
    res.status(500).json({ message: "Error updating supplier" });
  }
});

export default router;
