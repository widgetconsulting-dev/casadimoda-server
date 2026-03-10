import { Router, Request, Response } from "express";
import db from "../../utils/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

// GET /api/admin/products
router.get("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = 10;
    await db.connect();
    const totalProducts = await Product.countDocuments();
    const products = await Product.find({}).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize);
    res.json({ products, totalPages: Math.ceil(totalProducts / pageSize), totalProducts });
  } catch (err) {
    console.error("[GET /api/admin/products]", err);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// POST /api/admin/products
router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await db.connect();
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    console.error("[POST /api/admin/products]", err);
    res.status(500).json({ message: "Error creating product" });
  }
});

// PUT /api/admin/products
router.put("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, ...updateData } = req.body;
    await db.connect();
    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
    res.json(product);
  } catch (err) {
    console.error("[PUT /api/admin/products]", err);
    res.status(500).json({ message: "Error updating product" });
  }
});

// DELETE /api/admin/products?id=xxx
router.delete("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) { res.status(400).json({ message: "ID required" }); return; }
    await db.connect();
    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("[DELETE /api/admin/products]", err);
    res.status(500).json({ message: "Error deleting product" });
  }
});

// GET /api/admin/products/approve
router.get("/approve", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = 10;
    const status = (req.query.status as string) || "pending";
    await db.connect();
    const adminUser = await User.findOne({ email: req.user!.email });
    if (!adminUser?.isAdmin) { res.status(403).json({ message: "Admin access required" }); return; }
    const filter = { addedBy: "supplier", approvalStatus: status };
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("supplier", "businessName businessSlug contactEmail")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.json({ products, totalPages: Math.ceil(total / pageSize), totalProducts: total, currentPage: page });
  } catch (err) {
    console.error("[GET /api/admin/products/approve]", err);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// PUT /api/admin/products/approve
router.put("/approve", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, status, approvalNote } = req.body;
    if (!id || !status) { res.status(400).json({ message: "Product ID and status required" }); return; }
    if (!["approved", "rejected"].includes(status)) { res.status(400).json({ message: "Invalid status" }); return; }
    await db.connect();
    const product = await Product.findById(id);
    if (!product) { res.status(404).json({ message: "Product not found" }); return; }
    const updated = await Product.findByIdAndUpdate(id, { approvalStatus: status, approvalNote: approvalNote || "" }, { new: true })
      .populate("supplier", "businessName businessSlug");
    res.json(updated);
  } catch (err) {
    console.error("[PUT /api/admin/products/approve]", err);
    res.status(500).json({ message: "Error updating product" });
  }
});

export default router;
