import { Router, Request, Response } from "express";
import db from "../../utils/db";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import { authenticate } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

// GET /api/admin/summary
router.get("/", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await db.connect();
    const [ordersCount, productsCount, usersCount, ordersPriceGroup, salesData] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments(),
      Order.aggregate([{ $group: { _id: null, sales: { $sum: "$totalPrice" } } }]),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } }, totalSales: { $sum: "$totalPrice" } } },
        { $sort: { _id: 1 } },
        { $limit: 6 },
      ]),
    ]);
    res.json({
      ordersCount,
      productsCount,
      usersCount,
      totalSales: ordersPriceGroup.length > 0 ? ordersPriceGroup[0].sales : 0,
      salesData,
    });
  } catch (err) {
    console.error("[GET /api/admin/summary]", err);
    res.status(500).json({ message: "Error fetching summary" });
  }
});

export default router;
