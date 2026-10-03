import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const criticalPriority = await prisma.ticket.count({ where: { itPriority: 'Critical' } });
  
  const output = \
# Dashboard Metrics Verification

| Metric | DB Actual Count | Dashboard UI Match (Y/N) |
|--------|-----------------|--------------------------|
| Total Tickets | \ | Pending |
| New | \ | Pending |
| Open | \ | Pending |
| In Progress | \ | Pending |
| Resolved | \ | Pending |
| Closed | \ | Pending |
| Pending | \ | Pending |
| High/Critical Priority | \ | Pending |

*Verified independently via direct Prisma queries against the database.*
\;

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
