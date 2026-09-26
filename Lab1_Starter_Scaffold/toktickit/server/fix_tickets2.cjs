const fs = require('fs');

let content = fs.readFileSync('src/routes/tickets.ts', 'utf8');

// 1. Rename /assign to /owner and add OCC
content = content.replace(
  /\/\/ PATCH \/api\/tickets\/:id\/assign\s+router\.patch\("\/:id\/assign", requireRole\(\["IT_Staff", "Administrator"\]\), async \(req: Request, res: Response\) => \{[\s\S]*?const \{ ticketOwnerId \} = req\.body;/,
  `// PATCH /api/tickets/:id/owner
router.patch("/:id/owner", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { ticketOwnerId, version } = req.body;
    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });`
);

content = content.replace(
  /const ticket = await prisma\.ticket\.findUnique\(\{ where: \{ id: ticketId \} \}\);\s*if \(!ticket\) return res\.status\(404\)\.json\(\{ error: "Ticket not found" \}\);([\s\S]*?)const updated = await prisma\.ticket\.update\(\{([\s\S]*?)where: \{ id: ticketId \},([\s\S]*?)data: \{ ticketOwnerId: finalOwnerId \}\s*\}\);/g,
  `const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (ticket.version !== version) return res.status(409).json({ error: "Conflict", currentServerRow: ticket });
$1const updateRes = await prisma.ticket.updateMany({
      where: { id: ticketId, version: version },
      data: { ticketOwnerId: finalOwnerId, updatedAt: new Date(), version: { increment: 1 } }
    });
    if (updateRes.count === 0) {
      const latest = await prisma.ticket.findUnique({ where: { id: ticketId } });
      return res.status(409).json({ error: "Conflict", currentServerRow: latest });
    }
    const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });`
);

// 2. Add OCC logic to /priority
content = content.replace(
  /\/\/ PATCH \/api\/tickets\/:id\/priority\s+router\.patch\("\/:id\/priority", requireRole\(\["IT_Staff", "Administrator"\]\), async \(req: Request, res: Response\) => \{[\s\S]*?const \{ itPriority \} = req\.body;/,
  `// PATCH /api/tickets/:id/priority
router.patch("/:id/priority", requireRole(["IT_Staff", "Administrator"]), async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { itPriority, version } = req.body;
    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });`
);

content = content.replace(
  /const validPriorities = \["Low", "Medium", "High", "Urgent"\];\s*if \(!itPriority \|\| !validPriorities\.includes\(itPriority\)\) \{\s*return res\.status\(400\)\.json\(\{ error: "Invalid priority value\." \}\);\s*\}([\s\S]*?)const ticket = await prisma\.ticket\.findUnique\(\{ where: \{ id: ticketId \} \}\);\s*if \(!ticket\) return res\.status\(404\)\.json\(\{ error: "Ticket not found" \}\);\s*const updated = await prisma\.ticket\.update\(\{([\s\S]*?)where: \{ id: ticketId \},([\s\S]*?)data: \{ itPriority \}\s*\}\);/,
  `const validPriorities = ["Low", "Medium", "High", "Urgent"];
    if (!itPriority || !validPriorities.includes(itPriority)) {
      return res.status(400).json({ error: "Invalid priority value." });
    }
$1const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
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
    const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });`
);

// 3. Add OCC logic and BR-08 to /status
content = content.replace(
  /\/\/ PATCH \/api\/tickets\/:id\/status\s+router\.patch\("\/:id\/status", verifyTicketOwnership, async \(req: Request, res: Response\) => \{[\s\S]*?const \{ status, problemAppearsResolved \} = req\.body;/,
  `// PATCH /api/tickets/:id/status
router.patch("/:id/status", verifyTicketOwnership, async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { status, version } = req.body;
    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });`
);

content = content.replace(
  /if \(status === undefined && problemAppearsResolved === undefined\) \{\s*return res\.status\(400\)\.json\(\{ error: "No update fields provided" \}\);\s*\}/,
  `if (status === undefined) {
      return res.status(400).json({ error: "No update fields provided" });
    }`
);

// Remove the problemAppearsResolved logic inside /status since it moved to /confirm-resolved
content = content.replace(
  /if \(problemAppearsResolved !== undefined\) \{[\s\S]*?\}\s*if \(status !== undefined\) \{/g,
  `if (status !== undefined) {`
);

content = content.replace(
  /const isValidTransition = validNextStatuses\.some\(s => normalizeStatus\(s\) === normalizeStatus\(status\)\);\s*if \(!isValidTransition\) \{\s*return res\.status\(400\)\.json\(\{ error: `Cannot transition from '\$\{currentStatus\}' to '\$\{status\}'\.` \}\);\s*\}/,
  `const isValidTransition = validNextStatuses.some(s => normalizeStatus(s) === normalizeStatus(status));
        if (!isValidTransition) {
          return res.status(400).json({ error: \`Cannot transition from '\${currentStatus}' to '\${status}'.\` });
        }
        
        // BR-08: Action Taken required for Resolved
        if (status === "Resolved") {
           const actionCount = await prisma.actionTaken.count({ where: { ticketId } });
           if (actionCount === 0) {
              return res.status(400).json({ error: "Cannot resolve a ticket without at least one Action Taken recorded" });
           }
        }`
);

// Update status update to use OCC
content = content.replace(
  /let updateData: any = \{ currentStatus: status \};\s*if \(status === "Resolved"\) \{\s*updateData\.requesterConfirmedResolved = false;\s*\}\s*const updated = await prisma\.ticket\.update\(\{[\s\S]*?where: \{ id: ticketId \},[\s\S]*?data: updateData[\s\S]*?\}\);/m,
  `let updateData: any = { currentStatus: status, updatedAt: new Date(), version: { increment: 1 } };
        if (status === "Resolved") {
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
        
        const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });`
);


// 4. Update /confirm-resolved (remove old problemAppearsResolved update logic if it is present and replace with proper)
content = content.replace(
  /\/\/ PATCH \/api\/tickets\/:id\/confirm-resolved[\s\S]*?res\.status\(200\)\.json\(\{ message: "Ticket resolution confirmed\.", ticket: updated \}\);/,
  `// PATCH /api/tickets/:id/confirm-resolved
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
    res.status(200).json({ message: "Ticket resolution confirmed.", ticket: updated });`
);

fs.writeFileSync('src/routes/tickets.ts', content);
