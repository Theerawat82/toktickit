import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/users/staff
// Returns all active IT_Staff and Administrator users (id + name only).
// Only accessible by IT_Staff and Administrator roles.
router.get("/staff", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      where: {
        role: { in: ["IT_Staff", "Administrator"] },
        isActive: true
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Failed to fetch staff users:", error);
    res.status(500).json({ error: "Failed to fetch staff users" });
  }
});

export default router;
