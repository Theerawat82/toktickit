import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";

const prisma = getPrisma();

async function main() {
  console.log("Seeding database (Idempotent)...");

  // 1. Categories
  const categories = ["Account and Access", "Hardware", "Software", "Network"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2. Systems
  const systems = ["Email", "Campus Wi-Fi", "VPN", "LEB2 App"];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 3. Users
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const usersToSeed = [
    { email: "admin@toktickit.com", name: "Administrator", role: "Administrator" },
    { email: "staff1@toktickit.com", name: "IT Staff 1", role: "IT_Staff" },
    { email: "staff2@toktickit.com", name: "IT Staff 2", role: "IT_Staff" },
    { email: "staff3@toktickit.com", name: "IT Staff 3", role: "IT_Staff" }, // No assigned tickets for testing zeroes
    { email: "req1@toktickit.com", name: "Requester 1", role: "Requester" },
    { email: "req2@toktickit.com", name: "Requester 2", role: "Requester" }, // ZERO tickets
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role as any },
      create: {
        email: u.email,
        name: u.name,
        password: passwordHash,
        role: u.role as any,
      },
    });
  }

  const staff1 = await prisma.user.findUniqueOrThrow({ where: { email: "staff1@toktickit.com" } });
  const staff2 = await prisma.user.findUniqueOrThrow({ where: { email: "staff2@toktickit.com" } });
  const req1 = await prisma.user.findUniqueOrThrow({ where: { email: "req1@toktickit.com" } });
  const cat1 = await prisma.category.findFirstOrThrow();
  const sys1 = await prisma.relatedSystem.findFirstOrThrow();

  // 4. Tickets (covering EVERY status, assigned/unassigned)
  const ticketsToSeed = [
    { number: "TKT-100", status: "New", itPriority: "Low", req: req1.id, owner: null },
    { number: "TKT-101", status: "Open", itPriority: "Medium", req: req1.id, owner: staff1.id },
    { number: "TKT-102", status: "In_Progress", itPriority: "High", req: req1.id, owner: staff1.id },
    { number: "TKT-103", status: "Waiting_for_Requester", itPriority: "Urgent", req: req1.id, owner: staff2.id },
    { number: "TKT-104", status: "Resolved", itPriority: "Low", req: req1.id, owner: staff1.id },
    { number: "TKT-105", status: "Closed", itPriority: "Low", req: req1.id, owner: staff2.id },
    { number: "TKT-106", status: "Reopened", itPriority: "High", req: req1.id, owner: null },
    { number: "TKT-107", status: "Cancelled", itPriority: "Low", req: req1.id, owner: staff1.id },
    { number: "TKT-108", status: "New", itPriority: "Low", req: req1.id, owner: null },
  ];

  for (const t of ticketsToSeed) {
    await prisma.ticket.upsert({
      where: { ticketNumber: t.number },
      update: {
        status: t.status as any,
        currentStatus: t.status,
        itPriority: t.itPriority as any,
        ticketOwnerId: t.owner,
      },
      create: {
        ticketNumber: t.number,
        summary: `Issue for ${t.number}`,
        requestedPriority: "Low",
        categoryId: cat1.id,
        relatedSystemId: sys1.id,
        requesterId: t.req,
        status: t.status as any,
        currentStatus: t.status,
        itPriority: t.itPriority as any,
        ticketOwnerId: t.owner,
      },
    });
  }

  // 5. Actions Taken
  const tkt100 = await prisma.ticket.findUniqueOrThrow({ where: { ticketNumber: "TKT-100" } });
  const tkt101 = await prisma.ticket.findUniqueOrThrow({ where: { ticketNumber: "TKT-101" } });
  const tkt102 = await prisma.ticket.findUniqueOrThrow({ where: { ticketNumber: "TKT-102" } });
  
  // - 1 ticket with ZERO ActionTaken rows: TKT-100
  await prisma.actionTaken.deleteMany({ where: { ticketId: tkt100.id } });

  // - 1 ticket with EXACTLY ONE ActionTaken row: TKT-101
  await prisma.actionTaken.deleteMany({ where: { ticketId: tkt101.id } });
  await prisma.actionTaken.create({
    data: {
      ticketId: tkt101.id,
      actionDescription: "Assigned to myself",
      result: "Assignment complete",
      performedById: staff1.id,
    }
  });

  // - 1 ticket with MULTIPLE ActionTaken rows, performed by >=2 DIFFERENT IT Staff users: TKT-102
  await prisma.actionTaken.deleteMany({ where: { ticketId: tkt102.id } });
  await prisma.actionTaken.create({
    data: {
      ticketId: tkt102.id,
      actionDescription: "Investigated initial issue",
      result: "Found server down",
      performedById: staff2.id, // Different from owner (staff1)
    }
  });
  // - 1 ActionTaken row where followUpRequired=true AND followUpNote is filled in
  await prisma.actionTaken.create({
    data: {
      ticketId: tkt102.id,
      actionDescription: "Restarted server",
      result: "Server is up",
      performedById: staff1.id,
      followUpRequired: true,
      followUpNote: "Check back in 2 hours to ensure stability",
    }
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
