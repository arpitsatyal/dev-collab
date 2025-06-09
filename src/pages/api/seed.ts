const { faker } = require("@faker-js/faker");
const { TaskStatus, PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const TOTAL_PROJECTS = 500;
const SNIPPETS_PER_PROJECT = 2;
const TASKS_PER_PROJECT = 2;
const CHUNK_SIZE = 100;

const usedNames = new Set<string>();

function uniqueName(context: "project" | "snippet" | "task"): string {
  let name: string;
  do {
    switch (context) {
      case "project":
        name = faker.commerce.productName();
        break;
      case "snippet":
        name = `${faker.hacker.verb()} ${faker.commerce.productMaterial()}`;
        break;
      case "task":
        name = `${faker.hacker.verb()} ${faker.commerce.department()}`;
        break;
    }
  } while (usedNames.has(name));
  usedNames.add(name);
  return name;
}

function randomLang(): string {
  return faker.helpers.arrayElement([
    "JavaScript",
    "TypeScript",
    "Python",
    "HTML",
    "JSON",
  ]);
}

function fileExtension(lang: string): string {
  const extMap: Record<string, string> = {
    JavaScript: ".js",
    TypeScript: ".ts",
    Python: ".py",
    HTML: ".html",
    JSON: ".json",
  };
  return extMap[lang] ?? ".txt";
}

async function getUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({ select: { id: true } });
  return users.map((u: any) => u.id);
}

async function chunkedInsert(model: any, data: any[], label: string) {
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    try {
      await model.createMany({ data: chunk, skipDuplicates: true });
      console.log(`✅ Inserted ${label} ${i + 1}-${i + chunk.length}`);
    } catch (err) {
      console.error(
        `❌ Failed to insert ${label} ${i + 1}-${i + chunk.length}:`,
        err
      );
    }
  }
}

async function main() {
  try {
    const userIds = await getUserIds();
    if (userIds.length === 0) throw new Error("No users found.");

    console.log(`👤 Found ${userIds.length} users`);
    console.log(`🚧 Seeding ${TOTAL_PROJECTS} projects...`);

    const projectData = Array.from({ length: TOTAL_PROJECTS }, () => ({
      title: uniqueName("project"),
      description: faker.company.catchPhrase(),
      isPublic: faker.datatype.boolean(),
      ownerId: faker.helpers.arrayElement(userIds),
    }));

    await chunkedInsert(prisma.project, projectData, "projects");

    const projects = await prisma.project.findMany({ select: { id: true } });
    console.log(`📁 Created ${projects.length} projects`);

    const snippets: any[] = [];
    const tasks: any[] = [];

    for (const project of projects) {
      for (let i = 0; i < SNIPPETS_PER_PROJECT; i++) {
        const lang = randomLang();
        const authorId = faker.helpers.arrayElement(userIds);
        const editorId = faker.helpers.arrayElement(userIds);

        snippets.push({
          title: uniqueName("snippet"),
          language: lang,
          extension: fileExtension(lang),
          content: faker.lorem.sentences(3),
          projectId: project.id,
          authorId,
          lastEditedById: editorId,
        });
      }

      for (let i = 0; i < TASKS_PER_PROJECT; i++) {
        const authorId = faker.helpers.arrayElement(userIds);
        const assigneeId = faker.helpers.arrayElement(userIds);

        tasks.push({
          title: uniqueName("task"),
          description: faker.lorem.sentence(),
          status: faker.helpers.arrayElement(Object.values(TaskStatus)),
          projectId: project.id,
          authorId,
          assignedToId: assigneeId,
          dueDate: faker.date.soon({ days: 30 }),
        });
      }
    }

    console.log(`✏️ Creating ${snippets.length} snippets...`);
    await chunkedInsert(prisma.snippet, snippets, "snippets");

    console.log(`🗂 Creating ${tasks.length} tasks...`);
    await chunkedInsert(prisma.task, tasks, "tasks");

    console.log("🎉 All data seeded successfully!");
  } catch (err) {
    console.error("🔥 Error during seeding:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Main function error:", err);
  process.exit(1);
});
