import { Router, Request, Response } from "express";
import slugify from "slugify";
import db from "../../utils/db";
import User from "@/models/User";
import Supplier from "@/models/Supplier";
import Product from "@/models/Product";
import { authenticate } from "../../middleware/auth";
import { requireSupplier } from "../../middleware/requireRole";

const router = Router();

async function getApprovedSupplier(email: string) {
  const user = await User.findOne({ email });
  if (!user?.supplierId) return null;
  return Supplier.findById(user.supplierId);
}

// GET /api/supplier/products
router.get("/", authenticate, requireSupplier, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = 10;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    await db.connect();
    const supplier = await getApprovedSupplier(req.user!.email);
    if (!supplier) { res.status(404).json({ message: "Supplier profile not found" }); return; }
    const filter: Record<string, unknown> = { supplier: supplier._id };
    if (status && status !== "all") filter.approvalStatus = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize);
    res.json({ products, totalPages: Math.ceil(totalProducts / pageSize), totalProducts, currentPage: page });
  } catch (err) {
    console.error("[GET /api/supplier/products]", err);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// POST /api/supplier/products
router.post("/", authenticate, requireSupplier, async (req: Request, res: Response) => {
  try {
    await db.connect();
    const supplier = await getApprovedSupplier(req.user!.email);
    if (!supplier) { res.status(404).json({ message: "Supplier profile not found" }); return; }
    if (supplier.status !== "approved") { res.status(403).json({ message: "Your account must be approved to add products" }); return; }
    const body = req.body;
    let slug = body.slug || slugify(body.name, { lower: true, strict: true });
    if (await Product.findOne({ slug })) slug = `${slug}-${Date.now()}`;
    const product = await Product.create({
      name: body.name, slug, category: body.category, subCategory: body.subCategory,
      brand: body.brand, image: body.image, price: body.price, discountPrice: body.discountPrice || 0,
      countInStock: body.countInStock, description: body.description, deliveryTime: body.deliveryTime,
      dimensions: body.dimensions, weight: body.weight, cbm: body.cbm, hsCode: body.hsCode,
      sizes: body.sizes || [], colors: body.colors || [], colorImages: body.colorImages || [],
      isFeatured: false, supplier: supplier._id, approvalStatus: "pending", addedBy: "supplier",
    });
    await Supplier.findByIdAndUpdate(supplier._id, { $inc: { totalProducts: 1 } });
    res.status(201).json(product);
  } catch (err) {
    console.error("[POST /api/supplier/products]", err);
    res.status(500).json({ message: "Error creating product" });
  }
});

// PUT /api/supplier/products
router.put("/", authenticate, requireSupplier, async (req: Request, res: Response) => {
  try {
    await db.connect();
    const supplier = await getApprovedSupplier(req.user!.email);
    if (!supplier) { res.status(404).json({ message: "Supplier profile not found" }); return; }
    if (supplier.status !== "approved") { res.status(403).json({ message: "Account must be approved" }); return; }
    const body = req.body;
    const existing = await Product.findById(body._id || body.id);
    if (!existing) { res.status(404).json({ message: "Product not found" }); return; }
    if (existing.supplier?.toString() !== supplier._id.toString()) { res.status(403).json({ message: "Not your product" }); return; }
    const needsReapproval = existing.name !== body.name || existing.price !== body.price || existing.description !== body.description || existing.image !== body.image;
    const updateData = {
      name: body.name, slug: body.slug || existing.slug, category: body.category, subCategory: body.subCategory,
      brand: body.brand, image: body.image, price: body.price, discountPrice: body.discountPrice || 0,
      countInStock: body.countInStock, description: body.description, deliveryTime: body.deliveryTime,
      dimensions: body.dimensions, weight: body.weight, cbm: body.cbm, hsCode: body.hsCode,
      sizes: body.sizes || [], colors: body.colors || [], colorImages: body.colorImages || [],
      ...(needsReapproval && { approvalStatus: "pending", approvalNote: "" }),
    };
    const product = await Product.findByIdAndUpdate(body._id || body.id, updateData, { new: true });
    res.json(product);
  } catch (err) {
    console.error("[PUT /api/supplier/products]", err);
    res.status(500).json({ message: "Error updating product" });
  }
});

// DELETE /api/supplier/products?id=xxx
router.delete("/", authenticate, requireSupplier, async (req: Request, res: Response) => {
  try {
    const productId = req.query.id as string;
    if (!productId) { res.status(400).json({ message: "Product ID required" }); return; }
    await db.connect();
    const supplier = await getApprovedSupplier(req.user!.email);
    if (!supplier) { res.status(404).json({ message: "Supplier profile not found" }); return; }
    const product = await Product.findById(productId);
    if (!product) { res.status(404).json({ message: "Product not found" }); return; }
    if (product.supplier?.toString() !== supplier._id.toString()) { res.status(403).json({ message: "Not your product" }); return; }
    await Product.findByIdAndDelete(productId);
    await Supplier.findByIdAndUpdate(supplier._id, { $inc: { totalProducts: -1 } });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/supplier/products]", err);
    res.status(500).json({ message: "Error deleting product" });
  }
});

export default router;
