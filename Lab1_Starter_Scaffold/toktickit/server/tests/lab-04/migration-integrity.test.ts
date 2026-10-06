import { test, expect, describe } from "vitest";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

describe("Issue 6: Migration Integrity Test", () => {
  // Use a throwaway schema for this test to not drop the real dev DB
  test("Database can be wiped and seeded repeatedly without failure", async () => {
    const randomSchema = "test_schema_" + crypto.randomBytes(4).toString("hex");
    let baseDbUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5435/toktickit";
    if (baseDbUrl.includes("?")) {
      baseDbUrl = baseDbUrl.replace(/schema=[^&]*/, `schema=${randomSchema}`);
    } else {
      baseDbUrl += `?schema=${randomSchema}`;
    }
    
    // We execute prisma migrate deploy and seed
    try {
      // 1. Initial Deploy
      execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: baseDbUrl }, stdio: 'pipe' });
      execSync("npx tsx prisma/seed.ts", { env: { ...process.env, DATABASE_URL: baseDbUrl }, stdio: 'pipe' });
      
      const prisma = new PrismaClient({ datasources: { db: { url: baseDbUrl } } });
      
      const count1 = await prisma.ticket.count();
      expect(count1).toBeGreaterThan(0);
      
      // 2. Wipe the schema cleanly
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS ${randomSchema} CASCADE`);
      await prisma.$disconnect();

      // 3. Second Deploy (Idempotency / clean slate check)
      execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: baseDbUrl }, stdio: 'pipe' });
      execSync("npx tsx prisma/seed.ts", { env: { ...process.env, DATABASE_URL: baseDbUrl }, stdio: 'pipe' });

      const prisma2 = new PrismaClient({ datasources: { db: { url: baseDbUrl } } });
      const count2 = await prisma2.ticket.count();
      expect(count2).toBe(count1);
      
      const versions = await prisma2.ticket.count({ where: { version: { lt: 1 } } });
      expect(versions).toBe(0);

      // Verify no orphaned ActionTaken foreign keys
      const validTicketIds = (await prisma2.ticket.findMany({ select: { id: true } })).map(t => t.id);
      const orphanedActions = await prisma2.actionTaken.count({
        where: { ticketId: { notIn: validTicketIds } }
      });
      expect(orphanedActions).toBe(0);

      // Verify ActionTaken cardinality distribution
      const ticketsWithZeroActions = await prisma2.ticket.count({
        where: { actionsTaken: { none: {} } }
      });
      expect(ticketsWithZeroActions).toBeGreaterThanOrEqual(1);

      const allTicketsWithCounts = await prisma2.ticket.findMany({
        include: { _count: { select: { actionsTaken: true } } }
      });
      
      expect(allTicketsWithCounts.filter(t => t._count.actionsTaken === 1).length).toBeGreaterThanOrEqual(1);
      expect(allTicketsWithCounts.filter(t => t._count.actionsTaken >= 2).length).toBeGreaterThanOrEqual(1);

      // Verify at least one zero-ticket Requester exists
      const zeroTicketRequesters = await prisma2.user.count({
        where: {
          role: "Requester",
          requestedTickets: { none: {} }
        }
      });
      expect(zeroTicketRequesters).toBeGreaterThanOrEqual(1);

      // Drop schema cleanup
      await prisma2.$executeRawUnsafe(`DROP SCHEMA IF EXISTS ${randomSchema} CASCADE`);
      await prisma2.$disconnect();
    } catch (err: any) {
      if (err.stdout) console.log(err.stdout.toString());
      if (err.stderr) console.error(err.stderr.toString());
      throw err;
    }
  }, 30000);
});
