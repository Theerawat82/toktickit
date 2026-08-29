import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

// GET /api/categories – returns all categories ordered by id
router.get("/", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
