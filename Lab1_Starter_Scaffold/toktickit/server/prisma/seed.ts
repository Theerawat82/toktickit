import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

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

  // 2. Seed Related Systems (7 required items)
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

  // 3. Seed Requester Users (At least 4 active, at least 1 inactive)
  const requesters = [
    { name: "Somchai Jaidee", email: "somchai.jai@kmutt.ac.th", isActive: true },
    { name: "Somsri Srisuk", email: "somsri.sri@kmutt.ac.th", isActive: true },
    { name: "Anan Sukjai", email: "anan.suk@kmutt.ac.th", isActive: true },
    { name: "Manee Meema", email: "manee.mee@kmutt.ac.th", isActive: true },
    { name: "Old Employee", email: "old.emp@kmutt.ac.th", isActive: false },
  ];

  for (const user of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        isActive: user.isActive,
      },
      create: {
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  }
  console.log(`Seeded ${requesters.length} requester users (${requesters.filter(r => r.isActive).length} active, ${requesters.filter(r => !r.isActive).length} inactive) successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
