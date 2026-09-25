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



import { requireAuth, requireRole, verifyTicketOwnership } from "../middleware/auth.js";



const router = Router();

router.use(requireAuth);



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

    if (!categoryId || !systemId || !requestedPriority) {

      return res.status(400).json({ error: "Missing required fields" });

    }



    // Use req.user.id from JWT or fallback session instead of payload requesterId

    const actualRequesterId = req.user.id;



    const prisma = getPrisma();



    // Check if related records exist

    const [category, system, requester] = await Promise.all([

      prisma.category.findUnique({ where: { id: Number(categoryId) } }),

      prisma.relatedSystem.findUnique({ where: { id: Number(systemId) } }),

      prisma.user.findUnique({ where: { id: actualRequesterId, role: "Requester" } as any })

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

          requesterId: actualRequesterId,

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

    const requesterId = req.user.id;



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



router.get("/queue", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {

  try {

    const prisma = getPrisma();



    const {

      search,

      category,

      status,

      itPriority,

      ownerId,

      sort,

      order,

      page = "1",

      pageSize = "20"

    } = req.query;



    const pageNum = parseInt(page as string, 10) || 1;

    const limitNum = parseInt(pageSize as string, 10) || 20;

    const skip = (pageNum - 1) * limitNum;



    // Build where clause for filtering

    const whereClause: any = {};



    if (search) {

      whereClause.OR = [

        { ticketNumber: { contains: search as string, mode: "insensitive" } },

        { summary: { contains: search as string, mode: "insensitive" } }

      ];

    }



    if (category) {

      const catId = Number(category);

      if (!isNaN(catId)) {

        whereClause.categoryId = catId;

      }

    }



    if (status) {

      whereClause.currentStatus = status;

    }



    if (itPriority) {

      whereClause.itPriority = itPriority;

    }



    if (ownerId) {

      whereClause.ticketOwnerId = Number(ownerId);

    }



    // Sort clause

    let orderByClause: any = { createdAt: "desc" }; // default sort

    if (sort) {

      const sortStr = sort as string;

      const [field, dir] = sortStr.split(":");

      const allowedFields = ["createdAt", "updatedAt", "ticketNumber", "summary"];

      if (field && allowedFields.includes(field) && (dir === "asc" || dir === "desc")) {

        orderByClause = { [field]: dir };

      }

    }



    const [totalTickets, rawTickets] = await prisma.$transaction([

      prisma.ticket.count({ where: whereClause }),

      prisma.ticket.findMany({

        where: whereClause,

        orderBy: orderByClause,

        skip,

        take: limitNum,

        include: {

          category: true,

          requester: { select: { id: true, name: true } },

          ticketOwner: { select: { id: true, name: true } }

        }

      })

    ]);



    const tickets = rawTickets.map((t: any) => ({

      ...t,

      requesterUserId: t.requesterId,

      owner: t.ticketOwner ?? null

    }));



    const totalPages = Math.ceil(totalTickets / limitNum);



    res.status(200).json({

      data: tickets,

      pagination: {

        page: pageNum,

        pageSize: limitNum,

        totalItems: totalTickets,

        totalPages

      }

    });

  } catch (error) {

    console.error("Failed to fetch staff queue:", error);

    res.status(500).json({ error: "Failed to fetch staff queue" });

  }

});



// GET /api/tickets/:id

router.get("/:id", verifyTicketOwnership, async (req: Request, res: Response) => {

  try {

    const requesterId = req.user.id;



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

        ticketOwner: { select: { id: true, name: true, email: true, role: true } },

        attachments: true

      }

    });

    // Alias requesterId as requesterUserId for backward-compat with Lab 2 clients.

    // Falls back to existing requesterUserId when mocked objects don't have requesterId.

    const ticket = rawTicket ? { ...rawTicket, requesterUserId: (rawTicket as any).requesterId ?? (rawTicket as any).requesterUserId } : null;



    if (!ticket) {

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

    if (!err) {

      next();

      return;

    }



    let responded = false;

    const sendError = () => {

      if (responded) return;

      responded = true;

      res.set('Connection', 'close');

      res.status(400).json({ error: err.message });

    };



    if (req.readableEnded || req.destroyed) {

      sendError();

      return;

    }



    req.on('end', sendError);

    req.on('close', sendError);

    req.on('error', sendError);



    req.resume();

  });

}, verifyTicketOwnership, async (req: Request, res: Response) => {

  // ...handler เดิม ไม่ต้องแก้

  try {

    const requesterId = req.user.id;



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



// PATCH /api/tickets/:id/assign

router.patch("/:id/assign", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {

  try {

    const ticketId = Number(req.params.id);

    const { ticketOwnerId } = req.body;



    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });



    const prisma = getPrisma();



    // Check if ticket exists

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });



    let finalOwnerId = null;



    if (ticketOwnerId) {

      const newOwner = await prisma.user.findUnique({ where: { id: Number(ticketOwnerId) } });

      if (!newOwner) return res.status(400).json({ error: `User with ID ${ticketOwnerId} not found.` });

      if (!newOwner.isActive) return res.status(400).json({ error: `User with ID ${ticketOwnerId} is not active.` });

      if (newOwner.role !== "IT_Staff" && newOwner.role !== "Administrator") {

         return res.status(400).json({ error: `User with ID ${ticketOwnerId} is not an active IT Staff or Administrator.` });

      }

      finalOwnerId = newOwner.id;

    }



    const updated = await prisma.ticket.update({

      where: { id: ticketId },

      data: { ticketOwnerId: finalOwnerId }

    });



    res.status(200).json({ message: "Ticket owner updated successfully.", ticket: updated });

  } catch (error) {

    console.error("Failed to assign ticket:", error);

    res.status(500).json({ error: "Failed to assign ticket" });

  }

});



// PATCH /api/tickets/:id/priority

router.patch("/:id/priority", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {

  try {

    const ticketId = Number(req.params.id);

    const { itPriority } = req.body;



    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });



    const validPriorities = ["Low", "Medium", "High", "Urgent"];

    if (!itPriority || !validPriorities.includes(itPriority)) {

      return res.status(400).json({ error: "Invalid priority value." });

    }



    const prisma = getPrisma();

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });



    const updated = await prisma.ticket.update({

      where: { id: ticketId },

      data: { itPriority }

    });



    res.status(200).json({ message: "IT priority updated successfully.", ticket: updated });

  } catch (error) {

    console.error("Failed to update priority:", error);

    res.status(500).json({ error: "Failed to update priority" });

  }

});



// PATCH /api/tickets/:id/status

router.patch("/:id/status", verifyTicketOwnership, async (req: Request, res: Response) => {

  try {

    const ticketId = Number(req.params.id);

    const { status, problemAppearsResolved } = req.body;

    

    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });



    if (status === undefined && problemAppearsResolved === undefined) {

      return res.status(400).json({ error: "No update fields provided" });

    }



    const updateData: any = {};



    // BR-11: Requesters cannot change actual status

    if (status !== undefined) {

      if (req.user.role === "Requester") {

        return res.status(403).json({ error: "Requesters cannot change the ticket status directly" });

      }



      const prisma = getPrisma();

      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

      if (!ticket) return res.status(404).json({ error: "Ticket not found" });



      const currentStatus = ticket.currentStatus;



      // Status transition matrix BR-11 validation

      let validNextStatuses: string[] = [];

      switch (currentStatus) {

        case "New":

          validNextStatuses = ["Open", "Cancelled"];

          break;

        case "Open":

          validNextStatuses = ["In_Progress", "In Progress", "Resolved", "Cancelled"];

          break;

        case "In_Progress":

        case "In Progress":

          validNextStatuses = ["Waiting_for_Requester", "Waiting for Requester", "Resolved"];

          break;

        case "Waiting_for_Requester":

        case "Waiting for Requester":

          validNextStatuses = ["In_Progress", "In Progress", "Resolved"]; // From waiting, usually goes back to in progress or resolved.

          break;

        case "Resolved":

          validNextStatuses = ["Closed", "Reopened"];

          break;

        case "Reopened":

          validNextStatuses = ["In_Progress", "In Progress", "Resolved"]; // Assume similar to Open

          break;

        default:

          break;

      }



      // Normalize string matching (e.g. handle space vs underscore if needed)

      const normalizeStatus = (s: string) => s.replace(/_/g, " ");

      const isValidTransition = validNextStatuses.some(s => normalizeStatus(s) === normalizeStatus(status));



      if (!isValidTransition) {

         return res.status(409).json({ error: `Invalid status transition from ${currentStatus} to ${status}.` });

      }



      updateData.currentStatus = status;

      // also update enum if we are using it

      if (["New", "Open", "In_Progress", "Waiting_for_Requester", "Resolved", "Closed", "Reopened", "Cancelled"].includes(status.replace(/ /g, "_"))) {

         updateData.status = status.replace(/ /g, "_");

      }

    }



    // BR-12: Requesters can set problemAppearsResolved (as can IT Staff/Admin)

    if (problemAppearsResolved !== undefined) {

      if (typeof problemAppearsResolved !== "boolean") {

        return res.status(400).json({ error: "problemAppearsResolved must be a boolean" });

      }

      updateData.problemAppearsResolved = problemAppearsResolved;

    }



    const prisma = getPrisma();



    // Check if ticket is already Resolved/Closed (for BR-12 logic)

    if (problemAppearsResolved === true && req.user.role === "Requester") {

      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      if (ticket.currentStatus === "Resolved" || ticket.currentStatus === "Closed") {

         return res.status(400).json({ error: `Ticket is already ${ticket.currentStatus}` });

      }

    }



    const updated = await prisma.ticket.update({

      where: { id: ticketId },

      data: updateData

    });

    res.status(200).json({ message: "Ticket updated successfully.", ticket: updated });

  } catch (error) {

    console.error("Failed to update status:", error);

    res.status(500).json({ error: "Failed to update status" });

  }

});



// POST /api/tickets/:id/internal-notes

router.post("/:id/internal-notes", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {

  try {

    const ticketId = Number(req.params.id);

    const { content } = req.body;

    

    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });

    if (!content) return res.status(400).json({ error: "Content is required" });



    const prisma = getPrisma();

    const note = await prisma.internalNote.create({

      data: {

        content,

        ticketId,

        authorId: req.user.id

      }

    });

    res.status(201).json(note);

  } catch (error) {

    console.error("Failed to create internal note:", error);

    res.status(500).json({ error: "Failed to create internal note" });

  }

});



// GET /api/tickets/:id/internal-notes

// AC-06: Only IT Staff and Administrators may retrieve internal notes. Requesters receive 403.

router.get("/:id/internal-notes", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {

  try {

    const ticketId = Number(req.params.id);

    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });



    const prisma = getPrisma();

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });



    const notes = await prisma.internalNote.findMany({

      where: { ticketId },

      orderBy: { createdAt: "asc" },

      include: {

        author: {

          select: { id: true, name: true, role: true }

        }

      }

    });



    const result = notes.map((n: any) => ({

      id: n.id,

      content: n.content,

      createdAt: n.createdAt,

      author: {

        id: n.author.id,

        name: n.author.name,

        role: n.author.role

      }

    }));



    res.status(200).json(result);

  } catch (error) {

    console.error("Failed to fetch internal notes:", error);

    res.status(500).json({ error: "Failed to fetch internal notes" });

  }

});



// POST /api/tickets/:id/comments

// AC-07: Requester (must own ticket), IT Staff, Administrator may post public comments.

// BR-09: Comments are append-only, cannot be empty or whitespace-only.

router.post("/:id/comments", verifyTicketOwnership, async (req: Request, res: Response) => {

  try {

    const ticketId = Number(req.params.id);

    const { content } = req.body;



    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });



    // BR-09: Reject empty or whitespace-only content

    if (!content || typeof content !== "string" || content.trim().length === 0) {

      return res.status(400).json({ error: "Comment content cannot be empty" });

    }



    // Enforce maximum length (2000 chars)

    if (content.length > 2000) {

      return res.status(400).json({ error: "Comment content cannot exceed 2000 characters" });

    }



    const prisma = getPrisma();



    // Verify ticket exists

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });



    const comment = await prisma.comment.create({

      data: {

        content: content.trim(),

        ticketId,

        authorId: req.user.id

      }

    });



    res.status(201).json({

      id: comment.id,

      ticketId: comment.ticketId,

      authorId: comment.authorId,

      content: comment.content,

      createdAt: comment.createdAt

    });

  } catch (error) {

    console.error("Failed to create comment:", error);

    res.status(500).json({ error: "Failed to create comment" });

  }

});



// GET /api/tickets/:id/comments

// Requester (must own ticket), IT Staff, Administrator may view public comments.

router.get("/:id/comments", verifyTicketOwnership, async (req: Request, res: Response) => {

  try {

    const ticketId = Number(req.params.id);

    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });



    const prisma = getPrisma();



    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });



    const comments = await prisma.comment.findMany({

      where: { ticketId },

      orderBy: { createdAt: "asc" },

      include: {

        author: {

          select: { id: true, name: true, role: true }

        }

      }

    });



    const result = comments.map((c: any) => ({

      id: c.id,

      content: c.content,

      createdAt: c.createdAt,

      author: {

        id: c.author.id,

        name: c.author.name,

        role: c.author.role

      }

    }));



    res.status(200).json(result);

  } catch (error) {

    console.error("Failed to fetch comments:", error);

    res.status(500).json({ error: "Failed to fetch comments" });

  }

});





// POST /api/tickets/:id/actions
// AC-01: IT Staff and Admins can create an Action Taken
router.post("/:id/actions", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });

    const { actionDescription, result, followUpRequired, followUpNote, attachmentNotes, performedById, actionDateTime, ticketId: bodyTicketId, version, id } = req.body;

    if (performedById !== undefined || actionDateTime !== undefined || bodyTicketId !== undefined || version !== undefined || id !== undefined) {
      return res.status(400).json({ error: "Cannot provide read-only or server-generated fields" });
    }

    if (!actionDescription || typeof actionDescription !== "string" || actionDescription.trim() === "") {
      return res.status(400).json({ error: "actionDescription is required" });
    }
    if (!result || typeof result !== "string" || result.trim() === "") {
      return res.status(400).json({ error: "result is required" });
    }
    if (typeof followUpRequired !== "boolean") {
      return res.status(400).json({ error: "followUpRequired must be a boolean" });
    }
    if (followUpRequired && (!followUpNote || typeof followUpNote !== "string" || followUpNote.trim() === "")) {
      return res.status(400).json({ error: "followUpNote is required when followUpRequired is true" });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const action = await prisma.$transaction(async (tx) => {
      const created = await tx.actionTaken.create({
        data: {
          ticketId,
          actionDescription: actionDescription.trim(),
          result: result.trim(),
          followUpRequired,
          followUpNote: followUpRequired ? followUpNote.trim() : null,
          attachmentNotes: attachmentNotes ? attachmentNotes.trim() : null,
          performedById: req.user.id
        },
        include: { performedBy: { select: { id: true, name: true, role: true } } }
      });
      await tx.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() }
      });
      return created;
    });

    res.status(201).json(action);
  } catch (error) {
    console.error("Failed to create action taken:", error);
    res.status(500).json({ error: "Failed to create action taken" });
  }
});

// PATCH /api/tickets/:id/actions/:actionId
// Edit Action Taken with concurrency control
router.patch("/:id/actions/:actionId", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const actionId = Number(req.params.actionId);
    if (isNaN(ticketId) || isNaN(actionId)) return res.status(400).json({ error: "Invalid ID" });

    const { actionDescription, result, followUpRequired, followUpNote, attachmentNotes, version, performedById, actionDateTime, ticketId: bodyTicketId, id } = req.body;

    if (performedById !== undefined || actionDateTime !== undefined || bodyTicketId !== undefined || id !== undefined) {
      return res.status(400).json({ error: "Cannot change read-only fields" });
    }
    if (version === undefined || typeof version !== "number") {
      return res.status(400).json({ error: "version is required for updates" });
    }
    if (!actionDescription || typeof actionDescription !== "string" || actionDescription.trim() === "") {
      return res.status(400).json({ error: "actionDescription is required" });
    }
    if (!result || typeof result !== "string" || result.trim() === "") {
      return res.status(400).json({ error: "result is required" });
    }
    if (typeof followUpRequired !== "boolean") {
      return res.status(400).json({ error: "followUpRequired must be a boolean" });
    }
    if (followUpRequired && (!followUpNote || typeof followUpNote !== "string" || followUpNote.trim() === "")) {
      return res.status(400).json({ error: "followUpNote is required when followUpRequired is true" });
    }

    const prisma = getPrisma();
    
    // Check ticket access and action existence
    const currentAction = await prisma.actionTaken.findUnique({ 
      where: { id: actionId },
      include: { performedBy: { select: { id: true, name: true, role: true } } }
    });
    if (!currentAction || currentAction.ticketId !== ticketId) {
      return res.status(404).json({ error: "Action not found or mismatch" });
    }

    // Concurrency Check
    if (currentAction.version !== version) {
      return res.status(409).json({ error: "Conflict: This action has been modified by another user.", currentServerRow: currentAction });
    }

    try {
      const updatedAction = await prisma.$transaction(async (tx) => {
        const updateRes = await tx.actionTaken.updateMany({
          where: { id: actionId, version: version },
          data: {
            actionDescription: actionDescription.trim(),
            result: result.trim(),
            followUpRequired,
            followUpNote: followUpRequired ? followUpNote.trim() : null,
            attachmentNotes: attachmentNotes ? attachmentNotes.trim() : null,
            version: { increment: 1 }
          }
        });
        if (updateRes.count === 0) {
          throw new Error("CONCURRENCY_CONFLICT");
        }
        await tx.ticket.update({
          where: { id: ticketId },
          data: { updatedAt: new Date() }
        });
        return await tx.actionTaken.findUnique({
          where: { id: actionId },
          include: { performedBy: { select: { id: true, name: true, role: true } } }
        });
      });
      return res.status(200).json(updatedAction);
    } catch (e: any) {
      if (e.message === "CONCURRENCY_CONFLICT") {
        const latestRow = await prisma.actionTaken.findUnique({ where: { id: actionId }, include: { performedBy: { select: { id: true, name: true, role: true } } } });
        return res.status(409).json({ error: "Conflict: This action has been modified by another user.", currentServerRow: latestRow });
      }
      throw e;
    }

  } catch (error) {
    console.error("Failed to update action taken:", error);
    res.status(500).json({ error: "Failed to update action taken" });
  }
});

// GET /api/tickets/:id/actions
// Requesters can see their own, IT Staff can see any
router.get("/:id/actions", verifyTicketOwnership, async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const actions = await prisma.actionTaken.findMany({
      where: { ticketId },
      orderBy: { actionDateTime: "asc" },
      include: { performedBy: { select: { id: true, name: true, role: true } } }
    });

    res.status(200).json(actions);
  } catch (error) {
    console.error("Failed to fetch actions:", error);
    res.status(500).json({ error: "Failed to fetch actions" });
  }
});

export default router;

