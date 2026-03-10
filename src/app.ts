import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Routes
import authRouter from "./routes/auth";
import userProfileRouter from "./routes/user/profile";
import userOrdersRouter from "./routes/user/orders";
import productsRouter from "./routes/products";
import searchRouter from "./routes/search";
import colorsRouter from "./routes/colors";
import wishlistRouter from "./routes/wishlist";
import publicRouter from "./routes/public";
import couponRouter from "./routes/coupon";
import giftcardRouter from "./routes/giftcard";
import reviewsRouter from "./routes/reviews";
import uploadRouter from "./routes/upload";

import adminOrdersRouter from "./routes/admin/orders";
import adminProductsApproveRouter from "./routes/admin/productsApprove";
import adminProductsRouter from "./routes/admin/products";
import adminUsersRouter from "./routes/admin/users";
import adminSummaryRouter from "./routes/admin/summary";
import adminBrandsRouter from "./routes/admin/brands";
import adminCategoriesRouter from "./routes/admin/categories";
import adminSubcategoriesRouter from "./routes/admin/subcategories";
import adminColorsRouter from "./routes/admin/colors";
import adminCouponsRouter from "./routes/admin/coupons";
import adminGiftcardsRouter from "./routes/admin/giftcards";
import adminSuppliersRouter from "./routes/admin/suppliers";
import adminTransportersRouter from "./routes/admin/transporters";

import supplierRegisterRouter from "./routes/supplier/register";
import supplierProfileRouter from "./routes/supplier/profile";
import supplierProductsRouter from "./routes/supplier/products";
import supplierOrdersRouter from "./routes/supplier/orders";
import supplierSummaryRouter from "./routes/supplier/summary";
import supplierStorefrontRouter from "./routes/supplier/storefront";

import transporterOrdersRouter from "./routes/transporter/orders";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:8081", // Expo Web
  "http://192.168.0.14:8081", // Mobile connection to web
  "http://192.168.0.14:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow all origins (CORS can be tricky with mobile/web mixed testing)
      if (process.env.NODE_ENV === "development" || !origin) {
        callback(null, true);
      } else {
        // You could add stricter logic here for production
        callback(null, true); 
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Auth
app.use("/api/auth", authRouter);

// User
app.use("/api/user/profile", userProfileRouter);
app.use("/api/user/orders", userOrdersRouter);

// Public
app.use("/api/products", productsRouter);
app.use("/api/search", searchRouter);
app.use("/api/colors", colorsRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/giftcard", giftcardRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api", publicRouter);

// Admin — approve must be before generic products to avoid route shadowing
app.use("/api/admin/products/approve", adminProductsApproveRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/admin/summary", adminSummaryRouter);
app.use("/api/admin/brands", adminBrandsRouter);
app.use("/api/admin/categories", adminCategoriesRouter);
app.use("/api/admin/subcategories", adminSubcategoriesRouter);
app.use("/api/admin/colors", adminColorsRouter);
app.use("/api/admin/coupons", adminCouponsRouter);
app.use("/api/admin/giftcards", adminGiftcardsRouter);
app.use("/api/admin/suppliers", adminSuppliersRouter);
app.use("/api/admin/transporters", adminTransportersRouter);

// Supplier
app.use("/api/supplier/register", supplierRegisterRouter);
app.use("/api/supplier/profile", supplierProfileRouter);
app.use("/api/supplier/products", supplierProductsRouter);
app.use("/api/supplier/orders", supplierOrdersRouter);
app.use("/api/supplier/summary", supplierSummaryRouter);
app.use("/api/supplier/storefront", supplierStorefrontRouter);

// Transporter
app.use("/api/transporter/orders", transporterOrdersRouter);

export default app;
