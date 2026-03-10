import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin && req.user?.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
}

export function requireSupplier(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "supplier" && !req.user?.isAdmin) {
    res.status(403).json({ message: "Supplier access required" });
    return;
  }
  next();
}

export function requireTransporter(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "transporter" && !req.user?.isAdmin) {
    res.status(403).json({ message: "Transporter access required" });
    return;
  }
  next();
}
