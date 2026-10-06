import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", service: "TokTickIT API" });
  } catch (error) {
    res.status(503).json({ status: "degraded", service: "TokTickIT API" });
  }
});

export default router;
