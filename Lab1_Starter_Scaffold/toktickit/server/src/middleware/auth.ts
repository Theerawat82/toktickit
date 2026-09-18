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
 * Middleware to authenticate and authorize a request.
 *
 * Contract (Lab 3 api-spec.md; supersedes the Lab 2 `x-requester-id` prototype):
 *  - 401 Unauthorized : no token, malformed token, expired token, or the token
 *                        references a user that no longer exists.
 *  - 403 Forbidden    : identity IS established, but the account is not allowed
 *                        through (isActive === false, or mustChangePassword).
 *
 * Identity is derived ONLY from the session token (FR-04 / BR-06).
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  // 1. ถ้าไม่มี Token -> ตอบ 401 ทันที
  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing or invalid token" });
  }

  let user: any = null;

  // 2. ตรวจสอบ JWT Token
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const prisma = getPrisma();
    user = await prisma.user.findUnique({ where: { id: decoded.id } });
  } catch (err) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing or invalid token" });
  }

  // 3. ถ้า Token ใช้ได้แต่หา User ใน DB ไม่เจอ -> ตอบ 401
  if (!user) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing or invalid token" });
  }

  // 4. บัญชีถูกระงับ (Inactive) -> ตอบ 403
  if (user.isActive === false) {
    return res
      .status(403)
      .json({ error: "Account is inactive. Please contact your administrator." });
  }

  // 5. บังคับเปลี่ยนรหัสผ่าน (mustChangePassword) -> ตอบ 403 (เว้น Endpoint ยกเว้น)
  if (user.mustChangePassword) {
    const path = req.originalUrl || req.path;
    const isEscapeHatch =
      path.includes("/auth/change-password") ||
      path.includes("/auth/logout") ||
      path.includes("/auth/me");

    if (!isEscapeHatch) {
      return res.status(403).json({
        error:
          "Forbidden: You must change your password before accessing this resource.",
        mustChangePassword: true,
      });
    }
  }

  req.user = user;
  return next();
};

export const normalizeRole = (role: unknown): string =>
  typeof role === "string" ? role.trim().replace(/[\s-]+/g, "_") : "";

export const hasRole = (role: unknown, allowedRoles: string[]): boolean => {
  const actual = normalizeRole(role);
  return allowedRoles.some((allowed) => normalizeRole(allowed) === actual);
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !hasRole(req.user.role, allowedRoles)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

export const verifyTicketOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (hasRole(req.user.role, ["IT_Staff", "Administrator"])) {
    return next();
  }

  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) {
    return res.status(400).json({ error: "Invalid ticket ID" });
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { requesterId: true, id: true }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const reqId = ticket.requesterId ?? (ticket as any).requesterUserId;
    if (reqId !== req.user.id) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};