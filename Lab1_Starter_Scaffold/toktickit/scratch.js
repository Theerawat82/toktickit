const fs = require('fs');

let content = fs.readFileSync('server/src/routes/tickets.ts', 'utf8');

// Rename /assign to /owner
content = content.replace('router.patch("/:id/assign",', 'router.patch("/:id/owner",');

// Update owner to use version checking
content = content.replace(
  'const { ticketOwnerId } = req.body;',
  'const { ticketOwnerId, version } = req.body;\n    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });'
);
content = content.replace(
  'const updated = await prisma.ticket.update({',
  '// Concurrency check\n    const currentTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });\n    if (!currentTicket) return res.status(404).json({ error: "Ticket not found" });\n    if (currentTicket.version !== version) return res.status(409).json({ error: "Conflict", currentServerRow: currentTicket });\n\n    const updateRes = await prisma.ticket.updateMany({ where: { id: ticketId, version: version }, data: { ticketOwnerId: finalOwnerId, updatedAt: new Date(), version: { increment: 1 } } });\n    if (updateRes.count === 0) return res.status(409).json({ error: "Conflict", currentServerRow: await prisma.ticket.findUnique({ where: { id: ticketId } }) });\n\n    const updated = await prisma.ticket.findUnique({'
);

// Update priority to use version checking
content = content.replace(
  'const { itPriority } = req.body;',
  'const { itPriority, version } = req.body;\n    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });'
);
content = content.replace(
  'const updated = await prisma.ticket.update({\n      where: { id: ticketId },\n      data: { itPriority }\n    });',
  '// Concurrency check\n    const currentTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });\n    if (!currentTicket) return res.status(404).json({ error: "Ticket not found" });\n    if (currentTicket.version !== version) return res.status(409).json({ error: "Conflict", currentServerRow: currentTicket });\n\n    const updateRes = await prisma.ticket.updateMany({ where: { id: ticketId, version: version }, data: { itPriority, updatedAt: new Date(), version: { increment: 1 } } });\n    if (updateRes.count === 0) return res.status(409).json({ error: "Conflict", currentServerRow: await prisma.ticket.findUnique({ where: { id: ticketId } }) });\n\n    const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });'
);

// Replace entire status block
// Since status block ends before POST /internal-notes
const startStatus = content.indexOf('// PATCH /api/tickets/:id/status');
const endStatus = content.indexOf('// POST /api/tickets/:id/internal-notes');
const statusBlock = `// PATCH /api/tickets/:id/status
router.patch("/:id/status", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { status, version } = req.body;
    
    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });
    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });
    if (!status) return res.status(400).json({ error: "status is required" });

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Concurrency Check
    if (ticket.version !== version) {
      return res.status(409).json({ error: "Conflict", currentServerRow: ticket });
    }

    const currentStatus = ticket.currentStatus;
    
    // Status transition matrix
    let validNextStatuses: string[] = [];
    switch (currentStatus) {
      case "New": validNextStatuses = ["Open", "Cancelled"]; break;
      case "Open": validNextStatuses = ["In_Progress", "In Progress", "Resolved", "Cancelled"]; break;
      case "In_Progress":
      case "In Progress": validNextStatuses = ["Waiting_for_Requester", "Waiting for Requester", "Resolved"]; break;
      case "Waiting_for_Requester":
      case "Waiting for Requester": validNextStatuses = ["In_Progress", "In Progress"]; break;
      case "Resolved": validNextStatuses = ["Closed", "Reopened"]; break;
      case "Reopened": validNextStatuses = ["Open"]; break;
    }

    const normalizeStatus = (s: string) => s.replace(/_/g, " ");
    const isValidTransition = validNextStatuses.some(s => normalizeStatus(s) === normalizeStatus(status));

    if (!isValidTransition) {
       return res.status(400).json({ error: \`Cannot transition from '\${currentStatus}' to '\${status}'.\` });
    }

    const normStatus = normalizeStatus(status);

    // BR-06 Resolution Block Rule
    if (normStatus === "Resolved") {
      const actionCount = await prisma.actionTaken.count({ where: { ticketId } });
      if (actionCount === 0) {
        return res.status(400).json({ error: "Cannot resolve a ticket without at least one Action Taken recorded" });
      }
    }

    const updateData: any = {
      currentStatus: normStatus,
      updatedAt: new Date(),
      version: { increment: 1 }
    };
    if (["New", "Open", "In_Progress", "Waiting_for_Requester", "Resolved", "Closed", "Reopened", "Cancelled"].includes(normStatus.replace(/ /g, "_"))) {
       updateData.status = normStatus.replace(/ /g, "_");
    }

    if (normStatus !== "Resolved") {
      updateData.requesterConfirmedResolved = false;
    }

    const updateRes = await prisma.ticket.updateMany({
      where: { id: ticketId, version: version },
      data: updateData
    });
    
    if (updateRes.count === 0) {
      const latest = await prisma.ticket.findUnique({ where: { id: ticketId } });
      return res.status(409).json({ error: "Conflict", currentServerRow: latest });
    }

    const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });
    res.status(200).json({ message: "Ticket updated successfully.", ticket: updated });
  } catch (error) {
    console.error("Failed to update status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// PATCH /api/tickets/:id/confirm-resolved
router.patch("/:id/confirm-resolved", async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { version } = req.body;
    
    if (isNaN(ticketId)) return res.status(400).json({ error: "Invalid ticket ID" });
    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Auth check: Requester ONLY, must own the ticket
    if (req.user.role !== "Requester") {
      return res.status(403).json({ error: "Only requesters can confirm resolution" });
    }
    if (ticket.requesterId !== req.user.id) {
      return res.status(403).json({ error: "Not your ticket" });
    }

    if (ticket.currentStatus !== "Resolved") {
      return res.status(400).json({ error: "Ticket is not in a Resolved state" });
    }

    // Concurrency Check
    if (ticket.version !== version) {
      return res.status(409).json({ error: "Conflict", currentServerRow: ticket });
    }

    const updateRes = await prisma.ticket.updateMany({
      where: { id: ticketId, version: version },
      data: {
        requesterConfirmedResolved: true,
        updatedAt: new Date(),
        version: { increment: 1 }
      }
    });

    if (updateRes.count === 0) {
      const latest = await prisma.ticket.findUnique({ where: { id: ticketId } });
      return res.status(409).json({ error: "Conflict", currentServerRow: latest });
    }

    const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to confirm resolution:", error);
    res.status(500).json({ error: "Failed to confirm resolution" });
  }
});

`;

content = content.substring(0, startStatus) + statusBlock + content.substring(endStatus);

fs.writeFileSync('server/src/routes/tickets.ts', content);
console.log("Replaced successfully!");
