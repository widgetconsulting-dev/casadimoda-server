import { Router, Request, Response } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../utils/db";
import User from "@/models/User";
import { authenticate } from "../middleware/auth";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
};

function signToken(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  supplierId?: { toString(): string } | null;
  transporterCompanyId?: { toString(): string } | null;
}) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.isAdmin,
      supplierId: user.supplierId?.toString() || null,
      transporterCompanyId: user.transporterCompanyId?.toString() || null,
    },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email, and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }
    await db.connect();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ message: "An account with this email already exists" });
      return;
    }
    const hashed = bcryptjs.hashSync(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      isAdmin: false,
      role: "customer",
    });
    const token = signToken(user);
    res.cookie("token", token, COOKIE_OPTS);
    res.status(201).json({
      message: "Account created successfully",
      token,
      user: { _id: user._id.toString(), name: user.name, email: user.email, role: user.role, isAdmin: user.isAdmin },
    });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }
    await db.connect();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !bcryptjs.compareSync(password, user.password)) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    const token = signToken(user);
    res.cookie("token", token, COOKIE_OPTS);
    res.json({
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        supplierId: user.supplierId?.toString() || null,
        transporterCompanyId: user.transporterCompanyId?.toString() || null,
      },
    });
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// GET /api/auth/session
router.get("/session", authenticate, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
