import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";

const prisma = getPrisma();

async function main() {
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
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password: u.password,
        role: u.role as any,
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
      update: {},
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
