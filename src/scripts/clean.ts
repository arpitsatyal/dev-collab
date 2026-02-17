
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting cleanup...');

    // 1. Try to find the seed user
    const user = await prisma.user.findFirst({
        where: { email: 'seed@devcollab.com' },
    });

    if (user) {
        console.log(`👤 Found seed user: ${user.email} (${user.id})`);

        // Find projects owned by user
        const projects = await prisma.project.findMany({
            where: { ownerId: user.id },
            select: { id: true }
        });
        const projectIds = projects.map(p => p.id);

        if (projectIds.length > 0) {
            // Delete related records in batches to avoid large transaction limits if possible, 
            // but deleteMany is efficient enough for 1000s records usually.
            console.log(`🗑️ Deleting data for ${projectIds.length} projects...`);

            await prisma.snippet.deleteMany({ where: { projectId: { in: projectIds } } });
            await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } });
            await prisma.doc.deleteMany({ where: { projectId: { in: projectIds } } });

            // Delete projects
            await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
        }

        await prisma.user.delete({ where: { id: user.id } });
        console.log('✅ Cleaned up old seed user and all related data.');
    } else {
        console.log('❓ Seed user "seed@devcollab.com" not found. Nothing to clean.');
    }
}

main()
    .catch((e) => {
        console.error('❌ Error during cleanup:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
