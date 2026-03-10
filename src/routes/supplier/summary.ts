import { Router, Request, Response } from "express";
import db from "../../utils/db";
import User from "@/models/User";
import Supplier from "@/models/Supplier";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { authenticate } from "../../middleware/auth";
import { requireSupplier } from "../../middleware/requireRole";

const router = Router();

// GET /api/supplier/summary
router.get("/", authenticate, requireSupplier, async (req: Request, res: Response) => {
  try {
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user?.supplierId) { res.status(404).json({ message: "Supplier profile not found" }); return; }
    const supplier = await Supplier.findById(user.supplierId);
    if (!supplier) { res.status(404).json({ message: "Supplier profile not found" }); return; }
    const [totalProducts, approvedProducts, pendingProducts, rejectedProducts, supplierProducts] = await Promise.all([
      Product.countDocuments({ supplier: supplier._id }),
      Product.countDocuments({ supplier: supplier._id, approvalStatus: "approved" }),
      Product.countDocuments({ supplier: supplier._id, approvalStatus: "pending" }),
      Product.countDocuments({ supplier: supplier._id, approvalStatus: "rejected" }),
      Product.find({ supplier: supplier._id }).select("name").lean(),
    ]);
    const productNames = supplierProducts.map((p) => p.name);
    const orders = productNames.length > 0 ? await Order.find({ "orderItems.name": { $in: productNames } }) : [];
    let totalRevenue = 0;
    let totalOrders = 0;
    const orderSet = new Set<string>();
    for (const order of orders) {
      if (order.isPaid) {
        for (const item of order.orderItems) {
          if (productNames.includes(item.name)) totalRevenue += item.price * item.quantity;
        }
        if (!orderSet.has(order._id.toString())) { orderSet.add(order._id.toString()); totalOrders++; }
      }
    }
    const recentOrders = productNames.length > 0
      ? await Order.find({ "orderItems.name": { $in: productNames } }).sort({ createdAt: -1 }).limit(5).lean()
      : [];
    const commissionRate = supplier.commissionRate || 15;
    const commissionAmount = totalRevenue * (commissionRate / 100);
    res.json({
      status: supplier.status, businessName: supplier.businessName,
      totalProducts, approvedProducts, pendingProducts, rejectedProducts,
      totalRevenue, totalOrders, commissionRate, commissionAmount, netRevenue: totalRevenue - commissionAmount,
      rating: supplier.rating, numReviews: supplier.numReviews,
      recentOrders: recentOrders.map((o) => ({
        _id: o._id, createdAt: o.createdAt, totalPrice: o.totalPrice, isPaid: o.isPaid, isDelivered: o.isDelivered,
        itemCount: o.orderItems.filter((item: any) => productNames.includes(item.name)).length,
      })),
    });
  } catch (err) {
    console.error("[GET /api/supplier/summary]", err);
    res.status(500).json({ message: "Error fetching summary" });
  }
});

export default router;
