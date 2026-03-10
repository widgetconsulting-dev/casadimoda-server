import { Router, Request, Response } from "express";
import db from "../../utils/db";
import User from "@/models/User";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { authenticate } from "../../middleware/auth";
import { requireSupplier } from "../../middleware/requireRole";

const router = Router();

// GET /api/supplier/orders
router.get("/", authenticate, requireSupplier, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user?.supplierId) { res.status(404).json({ message: "Supplier not found" }); return; }
    const supplierProducts = await Product.find({ supplier: user.supplierId }).select("name").lean();
    const productNames = supplierProducts.map((p) => p.name);
    if (productNames.length === 0) { res.json({ orders: [], totalOrders: 0, activeCount: 0, pages: 1 }); return; }
    const baseFilter = { "orderItems.name": { $in: productNames } };
    const statusFilter: Record<string, unknown> = { ...baseFilter };
    if (status === "active") statusFilter.isDelivered = false;
    else if (status === "paid") { statusFilter.isPaid = true; statusFilter.isDelivered = false; }
    else if (status === "delivered") statusFilter.isDelivered = true;
    const [totalOrders, activeCount, orders] = await Promise.all([
      Order.countDocuments(statusFilter),
      Order.countDocuments({ ...baseFilter, isDelivered: false }),
      Order.find(statusFilter).populate("user", "name email").sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    ]);
    const serialized = orders.map((o) => ({
      _id: o._id.toString(),
      user: o.user ? { _id: (o.user as any)._id.toString(), name: (o.user as any).name, email: (o.user as any).email } : null,
      orderItems: o.orderItems.filter((item: any) => productNames.includes(item.name)),
      shippingAddress: o.shippingAddress,
      paymentMethod: o.paymentMethod,
      totalPrice: o.orderItems.filter((item: any) => productNames.includes(item.name)).reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
      isPaid: o.isPaid,
      isDelivered: o.isDelivered,
      paidAt: o.paidAt?.toString() || null,
      deliveredAt: o.deliveredAt?.toString() || null,
      createdAt: o.createdAt?.toString(),
    }));
    res.json({ orders: serialized, totalOrders, activeCount, pages: Math.ceil(totalOrders / pageSize) });
  } catch (err) {
    console.error("[GET /api/supplier/orders]", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

export default router;
