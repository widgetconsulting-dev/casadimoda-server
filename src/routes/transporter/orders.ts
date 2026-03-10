import { Router, Request, Response } from "express";
import db from "../../utils/db";
import User from "@/models/User";
import Order from "@/models/Order";
import { authenticate } from "../../middleware/auth";
import { requireTransporter } from "../../middleware/requireRole";

const router = Router();

// GET /api/transporter/orders?status=active|mine|delivered
router.get("/", authenticate, requireTransporter, async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || "active";
    await db.connect();
    const me = await User.findOne({ email: req.user!.email }).lean();
    if (!me) { res.status(404).json({ message: "User not found" }); return; }
    const myId = me._id;
    let filter: Record<string, unknown>;
    if (status === "mine") {
      filter = { isCancelled: { $ne: true }, isDelivered: false, transporter: myId };
    } else if (status === "delivered") {
      filter = { isCancelled: { $ne: true }, isDelivered: true, transporter: myId };
    } else {
      filter = { isCancelled: { $ne: true }, isDelivered: false, $or: [{ transporter: null }, { transporter: myId }] };
    }
    const orders = await Order.find(filter).populate("user", "name email").sort({ createdAt: -1 }).limit(80).lean();
    const myIdStr = myId.toString();
    res.json(orders.map((o) => ({
      _id: o._id.toString(),
      user: o.user ? { name: (o.user as any).name, email: (o.user as any).email } : null,
      orderItems: o.orderItems,
      shippingAddress: o.shippingAddress,
      paymentMethod: o.paymentMethod,
      totalPrice: o.totalPrice,
      isPaid: o.isPaid,
      isDelivered: o.isDelivered,
      isConfirmedByClient: o.isConfirmedByClient || false,
      transporter: o.transporter ? o.transporter.toString() : null,
      isAssignedToMe: o.transporter?.toString() === myIdStr,
      createdAt: o.createdAt?.toString(),
    })));
  } catch (err) {
    console.error("[GET /api/transporter/orders]", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// PUT /api/transporter/orders
router.put("/", authenticate, requireTransporter, async (req: Request, res: Response) => {
  try {
    const { orderId, isPaid, isDelivered, pickOrder, releaseOrder } = req.body;
    if (!orderId) { res.status(400).json({ message: "orderId required" }); return; }
    await db.connect();
    const me = await User.findOne({ email: req.user!.email }).lean();
    if (!me) { res.status(404).json({ message: "User not found" }); return; }
    const myId = me._id;
    const order = await Order.findById(orderId);
    if (!order) { res.status(404).json({ message: "Order not found" }); return; }
    if (pickOrder) {
      if (order.transporter) { res.status(400).json({ message: "Order already assigned" }); return; }
      order.transporter = myId;
      await order.save();
      res.json({ message: "Order picked" });
      return;
    }
    if (releaseOrder) {
      if (order.transporter?.toString() !== myId.toString()) { res.status(403).json({ message: "Not your order" }); return; }
      order.transporter = null;
      await order.save();
      res.json({ message: "Order released" });
      return;
    }
    if (order.transporter?.toString() !== myId.toString()) { res.status(403).json({ message: "Not your order" }); return; }
    if (typeof isPaid === "boolean") { order.isPaid = isPaid; if (isPaid) order.paidAt = new Date(); }
    if (typeof isDelivered === "boolean") { order.isDelivered = isDelivered; if (isDelivered) order.deliveredAt = new Date(); }
    await order.save();
    res.json({ message: "Order updated" });
  } catch (err) {
    console.error("[PUT /api/transporter/orders]", err);
    res.status(500).json({ message: "Error updating order" });
  }
});

export default router;
