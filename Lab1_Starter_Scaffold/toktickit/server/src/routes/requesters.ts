import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

// GET /api/requesters          – returns all active requesters (default)
// GET /api/requesters?active=true  – same, explicit filter
// GET /api/requesters?active=false – returns inactive requesters
router.get("/", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();

    // Build optional where filter — scope to Requester role only
    const where: { role: "Requester"; isActive?: boolean } = {
      role: "Requester",
    };
    if (req.query.active !== undefined) {
      where.isActive = req.query.active === "true";
    }

    const requesters = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, isActive: true },
      orderBy: { id: "asc" },
    });

    res.status(200).json(requesters);
  } catch (error) {
    console.error("Failed to fetch requesters:", error);
    res.status(500).json({ error: "Failed to fetch requesters" });
  }
});

export default router;
