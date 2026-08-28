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

// GET /api/tickets
router.get("/", async (req: Request, res: Response) => {
  try {
    const requesterId = req.header("x-requester-id");
    if (!requesterId || isNaN(Number(requesterId))) {
      return res.status(403).json({ error: "Missing or invalid x-requester-id header" });
    }

    const {
      search,
      category,
      requestedPriority,
      currentStatus,
      sort,
      page = "1",
      limit = "8"
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 8;
    const skip = (pageNum - 1) * limitNum;

    // Strict requester ownership isolation
    const whereClause: any = {
      requesterUserId: Number(requesterId)
    };

    // Case-insensitive partial match on ticketNumber and summary
    if (search) {
      whereClause.OR = [
        { ticketNumber: { contains: search as string, mode: "insensitive" } },
        { summary: { contains: search as string, mode: "insensitive" } }
      ];
    }

    if (category) {
      const catId = Number(category);
      if (isNaN(catId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      whereClause.categoryId = catId;
    }

    if (requestedPriority) {
      whereClause.requestedPriority = requestedPriority;
    }

    if (currentStatus) {
      whereClause.currentStatus = currentStatus;
    }

    // Default sort: createdAt desc
    let orderByClause: any = { createdAt: "desc" };
    if (sort) {
      const sortStr = sort as string;
      const [field, order] = sortStr.split(":");
      const allowedFields = ["createdAt", "updatedAt", "ticketNumber", "summary"];
      if (field && allowedFields.includes(field) && (order === "asc" || order === "desc")) {
        orderByClause = { [field]: order };
      }
    }

    const prisma = getPrisma();
    const [totalTickets, tickets] = await prisma.$transaction([
      prisma.ticket.count({ where: whereClause }),
      prisma.ticket.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limitNum,
        include: {
          category: true,
          requesterUser: true
        }
      })
    ]);

    const totalPages = Math.ceil(totalTickets / limitNum);

    res.status(200).json({
      data: tickets,
      meta: {
        totalTickets,
        page: pageNum,
        totalPages,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

export default router;

