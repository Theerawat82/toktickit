const fs = require('fs');

let content = fs.readFileSync('src/routes/tickets.ts', 'utf8');

// Rename /assign to /owner
content = content.replace(
  /\/\/ PATCH \/api\/tickets\/:id\/assign\s+router\.patch\("\/:id\/assign"/,
  '// PATCH /api/tickets/:id/owner\nrouter.patch("/:id/owner"'
);

// Add OCC logic to /owner (was /assign)
content = content.replace(
  /const { ticketOwnerId } = req\.body;/,
  'const { ticketOwnerId, version } = req.body;\n    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });'
);

content = content.replace(
  /const ticket = await prisma\.ticket\.findUnique\(\{ where: \{ id: ticketId \} \}\);\s*if \(!ticket\) return res\.status\(404\)\.json\(\{ error: "Ticket not found" \}\);([\s\S]*?)const updated = await prisma\.ticket\.update\(\{([\s\S]*?)where: \{ id: ticketId \},([\s\S]*?)data: \{ ticketOwnerId: finalOwnerId \}([\s\S]*?)\}\);/m,
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

// Add OCC logic to /priority
content = content.replace(
  /const { itPriority } = req\.body;/,
  'const { itPriority, version } = req.body;\n    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });'
);

content = content.replace(
  /const ticket = await prisma\.ticket\.findUnique\(\{ where: \{ id: ticketId \} \}\);\s*if \(!ticket\) return res\.status\(404\)\.json\(\{ error: "Ticket not found" \}\);\s*const updated = await prisma\.ticket\.update\(\{([\s\S]*?)where: \{ id: ticketId \},([\s\S]*?)data: \{ itPriority \}([\s\S]*?)\}\);/m,
  `const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
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

fs.writeFileSync('src/routes/tickets.ts', content);
