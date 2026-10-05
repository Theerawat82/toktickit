
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
  console.log('Connecting to DB and gathering metrics...');
  const total = await prisma.ticket.count();
  const newCount = await prisma.ticket.count({ where: { currentStatus: 'New' } });
  const openCount = await prisma.ticket.count({ where: { currentStatus: 'Open' } });
  const resolvedCount = await prisma.ticket.count({ where: { currentStatus: 'Resolved' } });
  const closedCount = await prisma.ticket.count({ where: { currentStatus: 'Closed' } });
  const inProgressCount = await prisma.ticket.count({ where: { currentStatus: 'In_Progress' } });
  const pendingCount = await prisma.ticket.count({ where: { currentStatus: 'Pending' } });
  
  const highPriority = await prisma.ticket.count({ where: { itPriority: 'High' } });
  const urgentPriority = await prisma.ticket.count({ where: { itPriority: 'Urgent' } });
  
  const output = [
    '# Dashboard Metrics Verification',
    '',
    '| Metric | DB Actual Count | Dashboard UI Match (Y/N) |',
    '|--------|-----------------|--------------------------|',
    '| Total Tickets | ' + total + ' | Pending |',
    '| New | ' + newCount + ' | Pending |',
    '| Open | ' + openCount + ' | Pending |',
    '| In Progress | ' + inProgressCount + ' | Pending |',
    '| Resolved | ' + resolvedCount + ' | Pending |',
    '| Closed | ' + closedCount + ' | Pending |',
    '| Pending | ' + pendingCount + ' | Pending |',
    '| High/Urgent Priority | ' + (highPriority + urgentPriority) + ' | Pending |',
    '',
    '*Verified independently via direct Prisma queries against the database.*'
  ].join('\n');

  const outPath = path.resolve(__dirname, '../../artifacts/lab-04/dashboard-vs-db.md');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, output.trim());
  console.log('Wrote ' + outPath);
  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

