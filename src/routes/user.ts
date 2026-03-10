import { Router, Request, Response } from "express";
import bcryptjs from "bcryptjs";
import db from "../utils/db";
import User from "@/models/User";
import Order from "@/models/Order";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/user/profile
router.get("/profile", authenticate, async (req: Request, res: Response) => {
  try {
    await db.connect();
    const user = await User.findOne({ email: req.user!.email }).select("-password");
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    res.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      createdAt: user.createdAt?.toString(),
    });
  } catch (err) {
    console.error("[GET /api/user/profile]", err);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// PUT /api/user/profile
router.put("/profile", authenticate, async (req: Request, res: Response) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    if (name) user.name = name;
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ message: "Current password is required" });
        return;
      }
      if (!bcryptjs.compareSync(currentPassword, user.password)) {
        res.status(400).json({ message: "Current password is incorrect" });
        return;
      }
      user.password = bcryptjs.hashSync(newPassword, 10);
    }
    await user.save();
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("[PUT /api/user/profile]", err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// GET /api/user/orders
router.get("/orders", authenticate, async (req: Request, res: Response) => {
  try {
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).lean();
    res.json(
      orders.map((o) => ({
        ...o,
        _id: o._id.toString(),
        user: o.user.toString(),
        createdAt: o.createdAt?.toString(),
        updatedAt: o.updatedAt?.toString(),
        paidAt: o.paidAt?.toString(),
        deliveredAt: o.deliveredAt?.toString(),
      }))
    );
  } catch (err) {
    console.error("[GET /api/user/orders]", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// POST /api/user/orders
router.post("/orders", authenticate, async (req: Request, res: Response) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, totalPrice } = req.body;
    if (!orderItems?.length || !shippingAddress || !paymentMethod) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    const order = await Order.create({
      user: user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice: 0,
      taxPrice: 0,
      totalPrice,
      isPaid: false,
      isDelivered: false,
    });
    res.status(201).json({ _id: order._id.toString() });
  } catch (err) {
    console.error("[POST /api/user/orders]", err);
    res.status(500).json({ message: "Error creating order" });
  }
});

// PUT /api/user/orders  (cancel or confirm reception)
router.put("/orders", authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId, cancellationReason, confirmReception } = req.body;
    if (!orderId) { res.status(400).json({ message: "orderId required" }); return; }
    await db.connect();
    const user = await User.findOne({ email: req.user!.email });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    const order = await Order.findOne({ _id: orderId, user: user._id });
    if (!order) { res.status(404).json({ message: "Order not found" }); return; }
    if (confirmReception) {
      if (!order.isDelivered) {
        res.status(400).json({ message: "Order not yet delivered" });
        return;
      }
      order.isConfirmedByClient = true;
      order.confirmedAt = new Date();
      await order.save();
      res.json({ message: "Reception confirmed" });
      return;
    }
    if (order.isPaid || order.isDelivered || order.isCancelled) {
      res.status(400).json({ message: "Cannot cancel this order" });
      return;
    }
    order.isCancelled = true;
    order.cancelledAt = new Date();
    order.cancellationReason = cancellationReason || "";
    order.cancelledBy = "client";
    await order.save();
    res.json({ message: "Order cancelled" });
  } catch (err) {
    console.error("[PUT /api/user/orders]", err);
    res.status(500).json({ message: "Error updating order" });
  }
});

export default router;
