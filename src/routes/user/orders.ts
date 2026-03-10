import { Router, Request, Response } from "express";
import db from "../../utils/db";
import User from "@/models/User";
import Order from "@/models/Order";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).lean();
    res.json(orders.map((o) => ({
      ...o, _id: o._id.toString(), user: o.user.toString(),
      createdAt: o.createdAt?.toString(), updatedAt: o.updatedAt?.toString(),
      paidAt: o.paidAt?.toString(), deliveredAt: o.deliveredAt?.toString(),
    })));
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, totalPrice } = req.body;
    if (!orderItems?.length || !shippingAddress || !paymentMethod) { res.status(400).json({ message: "Missing required fields" }); return; }
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    const order = await Order.create({ user: user._id, orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice: 0, taxPrice: 0, totalPrice, isPaid: false, isDelivered: false });
    res.status(201).json({ _id: order._id.toString() });
  } catch (err) {
    res.status(500).json({ message: "Error creating order" });
  }
});

router.put("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId, cancellationReason, confirmReception } = req.body;
    if (!orderId) { res.status(400).json({ message: "orderId required" }); return; }
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    const order = await Order.findOne({ _id: orderId, user: user._id });
    if (!order) { res.status(404).json({ message: "Order not found" }); return; }
    if (confirmReception) {
      if (!order.isDelivered) { res.status(400).json({ message: "Order not yet delivered" }); return; }
      order.isConfirmedByClient = true;
      order.confirmedAt = new Date();
      await order.save();
      res.json({ message: "Reception confirmed" });
      return;
    }
    if (order.isPaid || order.isDelivered || order.isCancelled) { res.status(400).json({ message: "Cannot cancel this order" }); return; }
    order.isCancelled = true;
    order.cancelledAt = new Date();
    order.cancellationReason = cancellationReason || "";
    order.cancelledBy = "client";
    await order.save();
    res.json({ message: "Order cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Error updating order" });
  }
});

export default router;
