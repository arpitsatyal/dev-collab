// const { faker } = require("@faker-js/faker");
// const { TaskStatus, PrismaClient } = require("@prisma/client");
// const { chunk } = require("lodash");
// const winston = require("winston");

// // Initialize logger
// const logger = winston.createLogger({
//   level: "info",
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.json()
//   ),
//   transports: [
//     new winston.transports.File({ filename: "seed.log" }),
//     new winston.transports.Console(),
//   ],
// });

// const prisma = new PrismaClient();
// const BATCH_SIZE = 100; // Process 100 records at a time to prevent memory issues
// const TOTAL_PROJECTS = 500;

// interface SeedError extends Error {
//   code?: string;
//   meta?: any;
// }

// async function seedDatabase() {
//   try {
//     logger.info("Starting database seeding process...");

//     // Fetch existing users
//     const users = await prisma.user.findMany({
//       select: { id: true },
//     });

//     if (users.length === 0) {
//       logger.error("No users found in the database");
//       throw new Error(
//         "No users available for seeding. Please seed users first."
//       );
//     }

//     logger.info(`Found ${users.length} users for seeding`);

//     const userIds = users.map((user: any) => user.id);
//     const projects: any[] = [];
//     const snippets: any[] = [];
//     const tasks: any[] = [];

//     // Generate 500 projects with meaningful data
//     logger.info("Generating project, snippet, and task data...");
//     for (let i = 0; i < TOTAL_PROJECTS; i++) {
//       const project = {
//         title: `${faker.hacker.adjective()} ${faker.commerce.productName()}`,
//         description: faker.lorem.paragraphs({ min: 1, max: 3 }),
//         createdAt: faker.date.past({ years: 2 }),
//         updatedAt: faker.date.recent(),
//         isPublic: faker.datatype.boolean({ probability: 0.3 }),
//         ownerId: userIds[Math.floor(Math.random() * userIds.length)],
//       };
//       projects.push(project);

//       // Generate 2 snippets per project
//       for (let j = 0; j < 2; j++) {
//         const language = faker.helpers.arrayElement([
//           "typescript",
//           "javascript",
//           "python",
//           "html",
//           "json",
//         ]);
//         snippets.push({
//           title: generateTitle(),
//           language,
//           content: JSON.stringify(generateSampleCode(language)),
//           createdAt: faker.date.past({ years: 1 }),
//           updatedAt: faker.date.recent(),
//           projectId: "", // Will be set after project creation
//           authorId: userIds[Math.floor(Math.random() * userIds.length)],
//           lastEditedById: userIds[Math.floor(Math.random() * userIds.length)],
//           extension: getFileExtension(language),
//         });
//       }

//       // Generate 2 tasks per project
//       for (let j = 0; j < 2; j++) {
//         tasks.push({
//           title: `${faker.hacker.verb()} ${faker.hacker.noun()} Task`,
//           description: faker.lorem.sentences({ min: 1, max: 3 }),
//           status: faker.helpers.arrayElement([
//             TaskStatus.TODO,
//             TaskStatus.IN_PROGRESS,
//             TaskStatus.DONE,
//           ]),
//           assignedToId: userIds[Math.floor(Math.random() * userIds.length)],
//           authorId: userIds[Math.floor(Math.random() * userIds.length)],
//           dueDate: faker.date.future({ years: 1 }),
//           createdAt: faker.date.past({ years: 1 }),
//           updatedAt: faker.date.recent(),
//           projectId: "", // Will be set after project creation
//         });
//       }
//     }

//     // Validate generated data
//     logger.info(
//       `Generated ${projects.length} projects, ${snippets.length} snippets, ${tasks.length} tasks`
//     );

//     // Batch create projects with transactions
//     logger.info(`Creating ${projects.length} projects in batches...`);
//     const projectChunks = chunk(projects, BATCH_SIZE);
//     const createdProjectIds: string[] = [];

//     for (const [index, projectChunk] of projectChunks.entries()) {
//       try {
//         const result = await prisma.$transaction(async (tx: any) => {
//           const created = await tx.project.createMany({
//             data: projectChunk,
//             skipDuplicates: true,
//           });
//           return created;
//         });
//         logger.info(
//           `Created ${result.count} projects in batch ${index + 1}/${
//             projectChunks.length
//           }`
//         );

//         // Fetch only the projects created in this batch
//         const savedProjects = await prisma.project.findMany({
//           select: { id: true },
//           where: {
//             createdAt: { gte: projectChunk[0].createdAt },
//             title: { in: projectChunk.map((p: any) => p.title) }, // Ensure exact match
//           },
//           orderBy: { createdAt: "asc" },
//         });
//         createdProjectIds.push(...savedProjects.map((p: any) => p.id));
//       } catch (error) {
//         const seedError = error as SeedError;
//         logger.error(`Failed to create project batch ${index + 1}`, {
//           error: seedError.message,
//           code: seedError.code,
//           meta: seedError.meta,
//         });
//         throw seedError;
//       }
//     }

//     // Validate created projects
//     if (createdProjectIds.length !== projects.length) {
//       logger.warn(
//         `Expected ${projects.length} projects, but created ${createdProjectIds.length}`
//       );
//     }

//     // Assign project IDs to snippets and tasks safely
//     logger.info("Assigning project IDs to snippets and tasks...");
//     for (let i = 0; i < createdProjectIds.length; i++) {
//       const projectId = createdProjectIds[i];
//       const startIdx = i * 2;

//       // Check if snippets and tasks exist at the expected indices
//       if (snippets[startIdx] && snippets[startIdx + 1]) {
//         snippets[startIdx].projectId = projectId;
//         snippets[startIdx + 1].projectId = projectId;
//       } else {
//         logger.warn(`Missing snippets at index ${startIdx} or ${startIdx + 1}`);
//       }

//       if (tasks[startIdx] && tasks[startIdx + 1]) {
//         tasks[startIdx].projectId = projectId;
//         tasks[startIdx + 1].projectId = projectId;
//       } else {
//         logger.warn(`Missing tasks at index ${startIdx} or ${startIdx + 1}`);
//       }
//     }

//     // Batch create snippets
//     logger.info(`Creating ${snippets.length} snippets in batches...`);
//     const snippetChunks = chunk(snippets, BATCH_SIZE);
//     let totalSnippetsCreated = 0;
//     for (const [index, snippetChunk] of snippetChunks.entries()) {
//       try {
//         // Filter out snippets with undefined projectId
//         const validSnippets = snippetChunk.filter(
//           (snippet: any) => snippet.projectId
//         );
//         if (validSnippets.length === 0) {
//           logger.warn(`No valid snippets in batch ${index + 1}`);
//           continue;
//         }
//         const result = await prisma.$transaction(async (tx: any) => {
//           return await tx.snippet.createMany({
//             data: validSnippets,
//             skipDuplicates: true,
//           });
//         });
//         totalSnippetsCreated += result.count;
//         logger.info(
//           `Created ${result.count} snippets in batch ${index + 1}/${
//             snippetChunks.length
//           }`
//         );
//       } catch (error) {
//         const seedError = error as SeedError;
//         logger.error(`Failed to create snippet batch ${index + 1}`, {
//           error: seedError.message,
//           code: seedError.code,
//           meta: seedError.meta,
//         });
//         throw seedError;
//       }
//     }

//     // Batch create tasks
//     logger.info(`Creating ${tasks.length} tasks in batches...`);
//     const taskChunks = chunk(tasks, BATCH_SIZE);
//     let totalTasksCreated = 0;
//     for (const [index, taskChunk] of taskChunks.entries()) {
//       try {
//         // Filter out tasks with undefined projectId
//         const validTasks = taskChunk.filter((task: any) => task.projectId);
//         if (validTasks.length === 0) {
//           logger.warn(`No valid tasks in batch ${index + 1}`);
//           continue;
//         }
//         const result = await prisma.$transaction(async (tx: any) => {
//           return await tx.task.createMany({
//             data: validTasks,
//             skipDuplicates: true,
//           });
//         });
//         totalTasksCreated += result.count;
//         logger.info(
//           `Created ${result.count} tasks in batch ${index + 1}/${
//             taskChunks.length
//           }`
//         );
//       } catch (error) {
//         const seedError = error as SeedError;
//         logger.error(`Failed to create task batch ${index + 1}`, {
//           error: seedError.message,
//           code: seedError.code,
//           meta: seedError.meta,
//         });
//         throw seedError;
//       }
//     }

//     logger.info("Seeding completed successfully", {
//       projectsCreated: createdProjectIds.length,
//       snippetsCreated: totalSnippetsCreated,
//       tasksCreated: totalTasksCreated,
//     });
//   } catch (error) {
//     const seedError = error as SeedError;
//     logger.error("Seeding failed", {
//       error: seedError.message,
//       code: seedError.code,
//       meta: seedError.meta,
//     });
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//     logger.info("Database connection closed");
//   }
// }

// function toPascalCase(str: string) {
//   return str
//     .split(/\s+/)
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join("");
// }

// function toCamelCase(str: string) {
//   const pascal = toPascalCase(str);
//   return pascal.charAt(0).toLowerCase() + pascal.slice(1);
// }

// function generateTitle(): string {
//   let verb = faker.hacker.verb();
//   let noun = faker.hacker.noun();

//   // sanitize spaces by converting to camelCase or PascalCase
//   // for snake_case, remove spaces and capitalize noun properly

//   const format = faker.helpers.arrayElement(["snake", "camel", "pascal"]);

//   switch (format) {
//     case "snake":
//       // remove spaces from verb, capitalize noun first letter, no spaces in noun as well
//       verb = verb.replace(/\s+/g, "");
//       noun = noun.replace(/\s+/g, "");
//       const capitalizedNoun = noun.charAt(0).toUpperCase() + noun.slice(1);
//       return `${verb}_${capitalizedNoun}`;

//     case "camel":
//       // camelCase verb + PascalCase noun
//       verb = toCamelCase(verb);
//       noun = toPascalCase(noun);
//       return `${verb}${noun}`;

//     case "pascal":
//       // PascalCase verb + PascalCase noun
//       verb = toPascalCase(verb);
//       noun = toPascalCase(noun);
//       return `${verb}${noun}`;

//     default:
//       return `${verb}_${noun}`;
//   }
// }

// // Helper function to generate sample code based on language
// function generateSampleCode(language: string): string {
//   switch (language) {
//     case "typescript":
//       return `interface ${faker.hacker.noun()} {
//   id: string;
//   name: string;
// }
// const ${faker.hacker.noun()}: ${faker.hacker.noun()} = {
//   id: "${faker.string.uuid()}",
//   name: "${faker.commerce.productName()}"
// };`;
//     case "javascript":
//       return `function ${faker.hacker.verb()}() {
//   return "${faker.hacker.phrase()}";
// }`;
//     case "python":
//       return `def ${faker.hacker.verb()}():
//     return "${faker.hacker.phrase()}"`;
//     case "java":
//       return `public class ${faker.hacker.noun()} {
//     public String ${faker.hacker.verb()}() {
//         return "${faker.hacker.phrase()}";
//     }
// }`;
//     case "html":
//       return `<div class="${faker.hacker.noun()}">
//   <h1>${faker.commerce.productName()}</h1>
//   <p>${faker.lorem.sentence()}</p>
// </div>`;
//     case "json":
//       return JSON.stringify(
//         {
//           [faker.hacker.noun()]: {
//             id: faker.string.uuid(),
//             name: faker.commerce.productName(),
//             description: faker.lorem.sentence(),
//             created: faker.date.past().toISOString(),
//           },
//         },
//         null,
//         2
//       );
//     default:
//       return faker.lorem.paragraph();
//   }
// }

// // Helper function to get file extension
// function getFileExtension(language: string): string {
//   const extensions: { [key: string]: string } = {
//     typescript: "ts",
//     javascript: "js",
//     python: "py",
//     html: "html",
//     json: "json",
//   };
//   return extensions[language] || "txt";
// }

// // Run the seed function
// seedDatabase().catch((error) => {
//   process.exit(1);
// });
