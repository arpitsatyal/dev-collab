const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

const docs = JSON.parse(fs.readFileSync("../Account.json", "utf-8"));

async function main() {
  for (const doc of docs) {
    const { createdAt, updatedAt, ...dataWithoutCreatedAt } = doc;

    await prisma.account.create({
      data: dataWithoutCreatedAt,
    });
  }
}

main()
  .then(() => {
    console.log("✅ Docs seeded successfully!");
  })
  .catch((e) => {
    console.error("❌ Error seeding docs:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
