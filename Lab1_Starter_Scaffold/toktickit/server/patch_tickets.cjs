const fs = require('fs');
let code = fs.readFileSync('src/routes/tickets.ts', 'utf8');

// 1. Rename /assign to /owner and add OCC
let assignBlockStart = code.indexOf('// PATCH /api/tickets/:id/assign');
let priorityBlockStart = code.indexOf('// PATCH /api/tickets/:id/priority');

if (assignBlockStart !== -1 && priorityBlockStart !== -1) {
  let before = code.substring(0, assignBlockStart);
  let after = code.substring(priorityBlockStart);
  
  let newOwnerBlock = `// PATCH /api/tickets/:id/owner
router.patch("/:id/owner", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { ticketOwnerId, version } = req.body;

    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });
    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });

    const prisma = getPrisma();

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    let finalOwnerId = null;

    if (ticketOwnerId) {
      const newOwner = await prisma.user.findUnique({ where: { id: Number(ticketOwnerId) } });
      if (!newOwner) return res.status(400).json({ error: \`User with ID \${ticketOwnerId} not found.\` });
      if (!newOwner.isActive) return res.status(400).json({ error: \`User with ID \${ticketOwnerId} is not active.\` });
      if (newOwner.role !== "IT_Staff" && newOwner.role !== "Administrator") {
         return res.status(400).json({ error: \`User with ID \${ticketOwnerId} is not an active IT Staff or Administrator.\` });
      }
      finalOwnerId = newOwner.id;
    }

    if (ticket.version !== version) return res.status(409).json({ error: "Conflict", currentServerRow: ticket });

    const updateRes = await prisma.ticket.updateMany({
      where: { id: ticketId, version: version },
      data: { ticketOwnerId: finalOwnerId, updatedAt: new Date(), version: { increment: 1 } }
    });

    if (updateRes.count === 0) {
      const latest = await prisma.ticket.findUnique({ where: { id: ticketId } });
      return res.status(409).json({ error: "Conflict", currentServerRow: latest });
    }

    const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });
    res.status(200).json({ message: "Ticket owner updated successfully.", ticket: updated });
  } catch (error) {
    console.error("Failed to assign ticket:", error);
    res.status(500).json({ error: "Failed to assign ticket" });
  }
});

`;
  code = before + newOwnerBlock + after;
}

// 2. Add OCC to /priority
priorityBlockStart = code.indexOf('// PATCH /api/tickets/:id/priority');
let statusBlockStart = code.indexOf('// PATCH /api/tickets/:id/status');

if (priorityBlockStart !== -1 && statusBlockStart !== -1) {
  let before = code.substring(0, priorityBlockStart);
  let after = code.substring(statusBlockStart);
  
  let newPriorityBlock = `// PATCH /api/tickets/:id/priority
router.patch("/:id/priority", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { itPriority, version } = req.body;

    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });
    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });

    const validPriorities = ["Low", "Medium", "High", "Urgent"];
    if (!itPriority || !validPriorities.includes(itPriority)) {
      return res.status(400).json({ error: "Invalid priority value." });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.version !== version) return res.status(409).json({ error: "Conflict", currentServerRow: ticket });

    const updateRes = await prisma.ticket.updateMany({
      where: { id: ticketId, version: version },
      data: { itPriority, updatedAt: new Date(), version: { increment: 1 } }
    });

    if (updateRes.count === 0) {
      const latest = await prisma.ticket.findUnique({ where: { id: ticketId } });
      return res.status(409).json({ error: "Conflict", currentServerRow: latest });
    }

    const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });
    res.status(200).json({ message: "Priority updated successfully.", ticket: updated });
  } catch (error) {
    console.error("Failed to update priority:", error);
    res.status(500).json({ error: "Failed to update priority" });
  }
});

`;
  code = before + newPriorityBlock + after;
}

// 3. Add OCC and BR-08 to /status
statusBlockStart = code.indexOf('// PATCH /api/tickets/:id/status');
let commentsBlockStart = code.indexOf('// GET /api/tickets/:id/comments'); // wait, there is a POST comments first
let postCommentsBlockStart = code.indexOf('// POST /api/tickets/:id/comments');
let confirmResolvedBlockStart = code.indexOf('// PATCH /api/tickets/:id/confirm-resolved');

let endOfStatus = confirmResolvedBlockStart !== -1 ? confirmResolvedBlockStart : postCommentsBlockStart;

if (statusBlockStart !== -1 && endOfStatus !== -1) {
  let before = code.substring(0, statusBlockStart);
  let after = code.substring(endOfStatus);
  
  let newStatusBlock = `// PATCH /api/tickets/:id/status
router.patch("/:id/status", verifyTicketOwnership, async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { status, version } = req.body;
    
    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });
    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });

    if (status === undefined) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (status !== undefined) {
      if (!req.user || !["IT_Staff", "Administrator"].includes(req.user.role)) {
        return res.status(403).json({ error: "Only IT Staff or Administrators can change the status." });
      }

      const currentStatus = ticket.currentStatus;
      let validNextStatuses: string[] = [];
      switch (currentStatus) {
        case "New": validNextStatuses = ["Open", "Cancelled"]; break;
        case "Open": validNextStatuses = ["In_Progress", "In Progress", "Resolved", "Cancelled"]; break;
        case "In Progress":
        case "In_Progress": validNextStatuses = ["Waiting_for_Requester", "Waiting for Requester", "Resolved"]; break;
        case "Waiting for Requester":
        case "Waiting_for_Requester": validNextStatuses = ["In_Progress", "In Progress", "Resolved"]; break;
        case "Resolved": validNextStatuses = ["Closed", "Reopened"]; break;
        case "Reopened": validNextStatuses = ["In_Progress", "In Progress", "Resolved"]; break;
      }
      
      const normalizeStatus = (s: string) => s.replace(/_/g, " ");
      const isValidTransition = validNextStatuses.some(s => normalizeStatus(s) === normalizeStatus(status));
      if (!isValidTransition) {
        return res.status(400).json({ error: \`Cannot transition from '\${currentStatus}' to '\${status}'.\` });
      }

      if (normalizeStatus(status) === "Resolved") {
         const actionCount = await prisma.actionTaken.count({ where: { ticketId } });
         if (actionCount === 0) {
            return res.status(400).json({ error: "Cannot resolve a ticket without at least one Action Taken recorded" });
         }
      }

      let updateData: any = { currentStatus: status, updatedAt: new Date(), version: { increment: 1 } };
      if (normalizeStatus(status) === "Resolved") {
        updateData.requesterConfirmedResolved = false;
      }

      if (ticket.version !== version) return res.status(409).json({ error: "Conflict", currentServerRow: ticket });
      
      const updateRes = await prisma.ticket.updateMany({
        where: { id: ticketId, version: version },
        data: updateData
      });

      if (updateRes.count === 0) {
        const latest = await prisma.ticket.findUnique({ where: { id: ticketId } });
        return res.status(409).json({ error: "Conflict", currentServerRow: latest });
      }
    }

    const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });
    res.status(200).json({ message: "Ticket status updated successfully.", ticket: updated });
  } catch (error) {
    console.error("Failed to update status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

`;
  code = before + newStatusBlock + after;
}

// 4. Update confirm-resolved
confirmResolvedBlockStart = code.indexOf('// PATCH /api/tickets/:id/confirm-resolved');
if (confirmResolvedBlockStart !== -1) {
  let afterConfirmBlockStart = code.indexOf('// POST /api/tickets/:id/comments');
  if (afterConfirmBlockStart !== -1) {
    let before = code.substring(0, confirmResolvedBlockStart);
    let after = code.substring(afterConfirmBlockStart);
    
    let newConfirmBlock = `// PATCH /api/tickets/:id/confirm-resolved
router.patch("/:id/confirm-resolved", verifyTicketOwnership, async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { version } = req.body;
    
    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });
    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });
    
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    
    if (req.user!.role === "Requester" && ticket.requesterId !== req.user!.id) {
       return res.status(403).json({ error: "Not your ticket" });
    }
    
    if (ticket.currentStatus !== "Resolved") {
       return res.status(400).json({ error: "Ticket is not in a Resolved state" });
    }
    
    if (ticket.version !== version) return res.status(409).json({ error: "Conflict", currentServerRow: ticket });
    
    const updateRes = await prisma.ticket.updateMany({
       where: { id: ticketId, version },
       data: { requesterConfirmedResolved: true, updatedAt: new Date(), version: { increment: 1 } }
    });
    
    if (updateRes.count === 0) {
       const latest = await prisma.ticket.findUnique({ where: { id: ticketId } });
       return res.status(409).json({ error: "Conflict", currentServerRow: latest });
    }
    
    const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });
    res.status(200).json({ message: "Ticket resolution confirmed.", ticket: updated });
  } catch (error) {
    console.error("Failed to confirm resolution:", error);
    res.status(500).json({ error: "Failed to confirm resolution" });
  }
});

`;
    code = before + newConfirmBlock + after;
  }
}

fs.writeFileSync('src/routes/tickets.ts', code);
