import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";

const prisma = getPrisma();

async function main() {
  console.log("Cleaning existing database...");
  await prisma.attachment.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.relatedSystem.deleteMany();
  await prisma.category.deleteMany();

  // 1. Seed Categories (4 required items)
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${categories.length} categories successfully.`);

  // 2. Seed Related Systems (7 items)
  const relatedSystems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${relatedSystems.length} related systems successfully.`);

  // 3. Seed Users
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const users = [
    {
      email: "admin@toktickit.com",
      name: "Admin User",
      password: passwordHash,
      role: "Administrator",
      mustChangePassword: false,
    },
    {
      email: "staff1@toktickit.com",
      name: "IT Staff 1",
      password: passwordHash,
      role: "IT_Staff",
      mustChangePassword: false,
    },
    {
      email: "staff2@toktickit.com",
      name: "IT Staff 2",
      password: passwordHash,
      role: "IT_Staff",
      mustChangePassword: false,
    },
    {
      email: "user1@toktickit.com",
      name: "Requester 1",
      password: passwordHash,
      role: "Requester",
      mustChangePassword: false,
    },
    {
      email: "newstaff@toktickit.com",
      name: "New Temp Staff",
      password: passwordHash,
      role: "IT_Staff",
      mustChangePassword: true,
    },
    {
      email: "inactive@toktickit.com",
      name: "Inactive User",
      password: passwordHash,
      role: "Requester",
      isActive: false,
      mustChangePassword: false,
    },
    {
      email: "staff3@toktickit.com",
      name: "IT Staff 3",
      password: passwordHash,
      role: "IT_Staff",
      mustChangePassword: false,
    },
    {
      email: "req1@toktickit.com",
      name: "Requester 1",
      password: passwordHash,
      role: "Requester",
      mustChangePassword: false,
    },
    {
      email: "req2@toktickit.com",
      name: "Requester 2",
      password: passwordHash,
      role: "Requester",
      mustChangePassword: false,
    },
    {
      email: "default_requester@toktickit.com",
      name: "Default Requester",
      password: passwordHash,
      role: "Requester",
      mustChangePassword: false,
    }

  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        password: u.password,
        role: u.role as any,
        isActive: u.isActive ?? true,
        mustChangePassword: u.mustChangePassword,
      },
      create: {
        email: u.email,
        name: u.name,
        password: u.password,
        role: u.role as any,
        isActive: u.isActive ?? true,
        mustChangePassword: u.mustChangePassword,
      },
    });
  }
  console.log(`Seeded ${users.length} users successfully.`);

  // Get some referenced IDs
  const admin = await prisma.user.findUnique({ where: { email: "admin@toktickit.com" } });
  const staff1 = await prisma.user.findUnique({ where: { email: "staff1@toktickit.com" } });
  const user1 = await prisma.user.findUnique({ where: { email: "user1@toktickit.com" } });
  
  const category1 = await prisma.category.findFirst();
  const system1 = await prisma.relatedSystem.findFirst();

  if (admin && staff1 && user1 && category1 && system1) {
    // 4. Seed Tickets
    const ticket1 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-001" },
      update: {
        status: "Open",
        currentStatus: "Open",
      },
      create: {
        ticketNumber: "TKT-001",
        summary: "Login issue",
        description: "Cannot login to the system",
        requestedPriority: "High",
        requesterId: user1.id,
        categoryId: category1.id,
        relatedSystemId: system1.id,
        itPriority: "High",
        status: "Open",
        currentStatus: "Open",
        ticketOwnerId: staff1.id,
      },
    });

    const ticket2 = await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-002" },
      update: {},
      create: {
        ticketNumber: "TKT-002",
        summary: "Printer not working",
        description: "Paper jam in main office printer",
        requestedPriority: "Low",
        requesterId: user1.id,
        categoryId: category1.id,
        relatedSystemId: system1.id,
        itPriority: "Low",
        status: "New",
      },
    });
    
    console.log("Seeded sample tickets successfully.");

    // 5. Seed Comments and Notes
    await prisma.comment.create({
      data: {
        ticketId: ticket1.id,
        authorId: user1.id,
        content: "Still waiting for an update on this.",
      }
    });

    await prisma.internalNote.create({
      data: {
        ticketId: ticket1.id,
        authorId: staff1.id,
        content: "Checking the AD logs for this user.",
      }
    });
    console.log("Seeded sample comments and internal notes successfully.");

  const req1 = await prisma.user.findUnique({ where: { email: "req1@toktickit.com" } });
  const staff2 = await prisma.user.findUnique({ where: { email: "staff2@toktickit.com" } });
  
  if (req1 && staff2) {
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
          categoryId: category1.id,
          relatedSystemId: system1.id,
          requesterId: t.req,
          status: t.status as any,
          currentStatus: t.status,
          itPriority: t.itPriority as any,
          ticketOwnerId: t.owner,
        },
      });
    }

    const tkt100 = await prisma.ticket.findUnique({ where: { ticketNumber: "TKT-100" } });
    const tkt101 = await prisma.ticket.findUnique({ where: { ticketNumber: "TKT-101" } });
    const tkt102 = await prisma.ticket.findUnique({ where: { ticketNumber: "TKT-102" } });
    
    if (tkt100 && tkt101 && tkt102) {
      await prisma.actionTaken.deleteMany({ where: { ticketId: tkt100.id } });

      await prisma.actionTaken.deleteMany({ where: { ticketId: tkt101.id } });
      await prisma.actionTaken.create({
        data: {
          ticketId: tkt101.id,
          actionDescription: "Assigned to myself",
          result: "Assignment complete",
          performedById: staff1.id,
        }
      });

      await prisma.actionTaken.deleteMany({ where: { ticketId: tkt102.id } });
      await prisma.actionTaken.create({
        data: {
          ticketId: tkt102.id,
          actionDescription: "Investigated initial issue",
          result: "Found server down",
          performedById: staff2.id,
        }
      });
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
    }
  }

  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
