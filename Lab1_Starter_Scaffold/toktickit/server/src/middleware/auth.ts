import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../prisma.js";

// Add user to Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";

/**
 * Middleware to authenticate the JWT token from the Authorization header.
 * Attaches the user object to `req.user` if valid.
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  let userId: number | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      userId = decoded.id;
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
    
    try {
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is inactive. Please contact your administrator." });
      }

      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  } else {
    // Fallback for Lab 2 backward compatibility
    const legacyId = req.header("x-requester-id") ?? req.body?.requesterId;
    if (legacyId) {
      const parsed = Number(legacyId);
      if (!isNaN(parsed)) {
        // Mock a user object to pass auth guards in Lab 2 tests
        req.user = { id: parsed, role: "Requester", isActive: true, mustChangePassword: false };
        return next();
      }
    }
  }

  // If neither token nor legacyId is present/valid
  return res.status(403).json({ error: "Missing or invalid x-requester-id header or token" });
};

/**
 * Middleware to enforce the mustChangePassword constraint.
 * If mustChangePassword is true, blocks access to regular endpoints.
 */
export const enforcePasswordChange = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.mustChangePassword) {
    return res.status(403).json({
      error: "Forbidden: You must change your password before accessing this resource.",
      mustChangePassword: true,
    });
  }
  next();
};

/**
 * Factory function to create role-based access control middleware.
 * @param allowedRoles Array of roles that are allowed to access the endpoint.
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};
