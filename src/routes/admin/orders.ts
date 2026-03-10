import { Router, Request, Response } from "express";
import db from "../../utils/db";
import Order from "@/models/Order";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

// GET /api/admin/orders
router.get("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    await db.connect();

    const filter: Record<string, unknown> = {};
    if (status === "active") { filter.isDelivered = false; filter.isCancelled = { $ne: true }; }
    else if (status === "paid") { filter.isPaid = true; filter.isDelivered = false; filter.isCancelled = { $ne: true }; }
    else if (status === "delivered") { filter.isDelivered = true; filter.isCancelled = { $ne: true }; }
    else if (status === "cancelled") { filter.isCancelled = true; }

    const [totalOrders, activeCount, cancelledCount, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({ isDelivered: false, isCancelled: { $ne: true } }),
      Order.countDocuments({ isCancelled: true }),
      Order.find(filter)
        .populate("user", "name email")
        .populate("transporter", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);

    const serialized = orders.map((o) => ({
      _id: o._id.toString(),
      user: o.user ? { _id: (o.user as any)._id.toString(), name: (o.user as any).name, email: (o.user as any).email } : null,
      orderItems: o.orderItems,
      shippingAddress: o.shippingAddress,
      paymentMethod: o.paymentMethod,
      totalPrice: o.totalPrice,
      isPaid: o.isPaid,
      isDelivered: o.isDelivered,
      transporter: o.transporter ? { _id: (o.transporter as any)._id.toString(), name: (o.transporter as any).name, email: (o.transporter as any).email } : null,
      isCancelled: o.isCancelled || false,
      cancellationReason: o.cancellationReason || null,
      cancelledBy: o.cancelledBy || null,
      paidAt: o.paidAt?.toString() || null,
      deliveredAt: o.deliveredAt?.toString() || null,
      cancelledAt: (o as any).cancelledAt?.toString() || null,
      createdAt: o.createdAt?.toString(),
    }));

    res.json({ orders: serialized, totalOrders, activeCount, cancelledCount, pages: Math.ceil(totalOrders / pageSize) });
  } catch (err) {
    console.error("[GET /api/admin/orders]", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// PUT /api/admin/orders
router.put("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderId, isPaid, isDelivered, isCancelled, cancellationReason, transporterId } = req.body;
    if (!orderId) { res.status(400).json({ message: "orderId required" }); return; }
    await db.connect();
    const update: Record<string, unknown> = {};
    if (typeof isPaid === "boolean") { update.isPaid = isPaid; if (isPaid) update.paidAt = new Date(); }
    if (typeof isDelivered === "boolean") { update.isDelivered = isDelivered; if (isDelivered) update.deliveredAt = new Date(); }
    if (transporterId !== undefined) { update.transporter = transporterId || null; }
    if (typeof isCancelled === "boolean") {
      update.isCancelled = isCancelled;
      if (isCancelled) { update.cancelledAt = new Date(); update.cancelledBy = "admin"; update.cancellationReason = cancellationReason || ""; }
    }
    const order = await Order.findByIdAndUpdate(orderId, update, { new: true });
    if (!order) { res.status(404).json({ message: "Order not found" }); return; }
    res.json({ message: "Order updated" });
  } catch (err) {
    console.error("[PUT /api/admin/orders]", err);
    res.status(500).json({ message: "Error updating order" });
  }
});

export default router;
