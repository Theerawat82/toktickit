const fs = require('fs');

let content = fs.readFileSync('server/src/routes/tickets.ts', 'utf8');

// Fix 1: owner endpoint 
// In the current file, the owner endpoint ends with:
// const updated = await prisma.ticket.findUnique({
//   where: { id: ticketId },
//   data: { ticketOwnerId: finalOwnerId }
// });
// We must remove the `data` property.
content = content.replace(
  /const updated = await prisma\.ticket\.findUnique\(\{\s*where:\s*\{\s*id:\s*ticketId\s*\},?\s*data:\s*\{\s*ticketOwnerId:\s*finalOwnerId\s*\}\s*\}\);/g,
  `const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });`
);

// Fix 2: priority endpoint (Add OCC)
// Find the priority endpoint
content = content.replace(
  /const \{ itPriority \} = req\.body;/g,
  `const { itPriority, version } = req.body;\n    if (version === undefined || typeof version !== "number") return res.status(400).json({ error: "version is required" });`
);
content = content.replace(
  /const updated = await prisma\.ticket\.update\(\{\s*where:\s*\{\s*id:\s*ticketId\s*\},?\s*data:\s*\{\s*itPriority\s*\}\s*\}\);/g,
  `// Concurrency check\n    const currentTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });\n    if (!currentTicket) return res.status(404).json({ error: "Ticket not found" });\n    if (currentTicket.version !== version) return res.status(409).json({ error: "Conflict", currentServerRow: currentTicket });\n\n    const updateRes = await prisma.ticket.updateMany({ where: { id: ticketId, version: version }, data: { itPriority, updatedAt: new Date(), version: { increment: 1 } } });\n    if (updateRes.count === 0) return res.status(409).json({ error: "Conflict", currentServerRow: await prisma.ticket.findUnique({ where: { id: ticketId } }) });\n\n    const updated = await prisma.ticket.findUnique({ where: { id: ticketId } });`
);

fs.writeFileSync('server/src/routes/tickets.ts', content);
console.log("tickets.ts fixed!");
