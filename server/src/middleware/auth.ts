import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../types/index.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Not authenticated" });
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user!.role as UserRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export function requireActive(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
  if (req.user!.status !== "active") return res.status(403).json({ error: "Account is not active" });
  next();
}
