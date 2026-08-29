import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

// GET /api/related-systems – returns all related systems ordered by id
router.get("/", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const systems = await prisma.relatedSystem.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.status(200).json(systems);
  } catch (error) {
    console.error("Failed to fetch related systems:", error);
    res.status(500).json({ error: "Failed to fetch related systems" });
  }
});

export default router;
