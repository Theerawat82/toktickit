import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});

const uploadSingle = upload.single("file");

// TODO [LAB3-03]: Replace x-requester-id header parsing with authenticated JWT/Session context (Issue #3)
// Extracts and validates the requester's user ID from the request.
// For Lab 2 backward compatibility, reads from the x-requester-id header or req.body.requesterId.
// Returns a parsed integer ID, or null if missing/invalid.
function getRequesterUserId(req: Request): number | null {
  const raw = req.header("x-requester-id") ?? req.body?.requesterId;
  if (raw === undefined || raw === null || raw === "") return null;
  const parsed = Number(raw);
  return isNaN(parsed) ? null : parsed;
}

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
      prisma.user.findUnique({ where: { id: Number(requesterId), role: "Requester" } as any })
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

      const created = await tx.ticket.create({
        data: {
          ticketNumber,
          summary,
          description,
          requestedPriority,
          currentStatus: "New",
          categoryId: Number(categoryId),
          relatedSystemId: Number(systemId),
          requesterId: Number(requesterId),
        }
      });
      // Alias requesterId as requesterUserId for backward-compat with Lab 2 clients
      return { ...created, requesterUserId: created.requesterId };
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
    // TODO [LAB3-03]: Replace x-requester-id header parsing with authenticated JWT/Session context (Issue #3)
    const requesterId = getRequesterUserId(req);
    if (requesterId === null) {
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
      requesterId: requesterId
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
    const [totalTickets, rawTickets] = await prisma.$transaction([
      prisma.ticket.count({ where: whereClause }),
      prisma.ticket.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limitNum,
        include: {
          category: true,
          requester: true
        }
      })
    ]);
    // Alias requesterId as requesterUserId for backward-compat with Lab 2 clients
    const tickets = rawTickets.map((t: any) => ({ ...t, requesterUserId: t.requesterId }));

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

// GET /api/tickets/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    // TODO [LAB3-03]: Replace x-requester-id header parsing with authenticated JWT/Session context (Issue #3)
    const requesterId = getRequesterUserId(req);
    if (requesterId === null) {
      return res.status(403).json({ error: "Missing or invalid x-requester-id header" });
    }

    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const prisma = getPrisma();
    const rawTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        requester: true,
        attachments: true
      }
    });
    // Alias requesterId as requesterUserId for backward-compat with Lab 2 clients.
    // Falls back to existing requesterUserId when mocked objects don't have requesterId.
    const ticket = rawTicket ? { ...rawTicket, requesterUserId: (rawTicket as any).requesterId ?? (rawTicket as any).requesterUserId } : null;

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Security: Return 404 (not 403) on ownership failure to prevent IDOR enumeration.
    if (ticket.requesterUserId !== requesterId) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Failed to fetch ticket detail:", error);
    res.status(500).json({ error: "Failed to fetch ticket detail" });
  }
});

// POST /api/tickets/:id/attachments
router.post("/:id/attachments", (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    // TODO [LAB3-03]: Replace x-requester-id header parsing with authenticated JWT/Session context (Issue #3)
    const requesterId = getRequesterUserId(req);
    if (requesterId === null) {
      return res.status(403).json({ error: "Missing or invalid x-requester-id header" });
    }

    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const prisma = getPrisma();
    const rawTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { attachments: { where: { isRemoved: false } } }
    });
    const ticket = rawTicket ? { ...rawTicket, requesterUserId: (rawTicket as any).requesterId ?? (rawTicket as any).requesterUserId } : null;

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Security: Return 404 (not 403) on ownership failure to prevent IDOR enumeration.
    if (ticket.requesterUserId !== requesterId) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.attachments.length >= 5) {
      return res.status(400).json({ error: "Maximum of 5 active attachments allowed" });
    }

    // Save attachment record to db
    const attachment = await prisma.attachment.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`, // Using relative path for reference, download endpoint handles actual path
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        ticketId: ticket.id
      }
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

export default router;
