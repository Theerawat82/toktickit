import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

// POST /api/tickets
router.post("/", async (req: Request, res: Response) => {
  try {
    const { summary, description, categoryId, systemId, requestedPriority, requesterId } = req.body;

    // Validation
    if (!summary || typeof summary !== 'string' || summary.length > 200) {
      return res.status(400).json({ error: "Summary must be provided and not exceed 200 characters" });
    }
    if (!description || typeof description !== 'string' || description.length < 20) {
      return res.status(400).json({ error: "Description must be provided and be at least 20 characters long" });
    }
    if (!categoryId || !systemId || !requestedPriority || !requesterId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prisma = getPrisma();

    // Check if related records exist
    const [category, system, requester] = await Promise.all([
      prisma.category.findUnique({ where: { id: Number(categoryId) } }),
      prisma.relatedSystem.findUnique({ where: { id: Number(systemId) } }),
      prisma.requesterUser.findUnique({ where: { id: Number(requesterId) } })
    ]);

    if (!category) return res.status(400).json({ error: "Invalid categoryId" });
    if (!system) return res.status(400).json({ error: "Invalid systemId" });
    if (!requester) return res.status(400).json({ error: "Invalid requesterId" });

    // Transaction to safely generate ticketNumber and create ticket
    const ticket = await prisma.$transaction(async (tx) => {
      const lastTicket = await tx.ticket.findFirst({
        orderBy: { id: "desc" },
      });
      const nextId = lastTicket ? lastTicket.id + 1 : 1;
      const ticketNumber = "TIK-" + String(nextId).padStart(5, "0");

      return await tx.ticket.create({
        data: {
          ticketNumber,
          summary,
          description,
          requestedPriority,
          currentStatus: "New",
          categoryId: Number(categoryId),
          relatedSystemId: Number(systemId),
          requesterUserId: Number(requesterId),
        }
      });
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error("Failed to create ticket:", error);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

export default router;
