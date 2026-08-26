import { getPrisma } from "../src/prisma.js";

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

  // 3. Seed Requester Users (4 Active, 1 Inactive)
  const requesters = [
    { name: "Alice Johnson", email: "alice@example.com", isActive: true },
    { name: "Bob Smith", email: "bob@example.com", isActive: true },
    { name: "Charlie Davis", email: "charlie@example.com", isActive: true },
    { name: "Diana Prince", email: "diana@example.com", isActive: true },
    { name: "Evan Wright", email: "evan@example.com", isActive: false },
  ];

  for (const requester of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: requester.email },
      update: { name: requester.name, isActive: requester.isActive },
      create: requester,
    });
  }

  const activeCount = requesters.filter((r) => r.isActive).length;
  const inactiveCount = requesters.filter((r) => !r.isActive).length;
  console.log(`Seeded ${requesters.length} requester users (${activeCount} active, ${inactiveCount} inactive) successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
