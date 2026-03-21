
import { PrismaClient } from "../types";

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting cleanup...');

    // 1. Try to find the seed user
    const user = await prisma.user.findFirst({
        where: { email: 'seed@devcollab.com' },
    });

    if (user) {
        console.log(`👤 Found seed user: ${user.email} (${user.id})`);

        // Find workspaces owned by user
        const workspaces = await prisma.workspace.findMany({
            where: { ownerId: user.id },
            select: { id: true }
        });
        const workspaceIds = workspaces.map(p => p.id);

        if (workspaceIds.length > 0) {
            // Delete related records in batches to avoid large transaction limits if possible, 
            // but deleteMany is efficient enough for 1000s records usually.
            console.log(`🗑️ Deleting data for ${workspaceIds.length} workspaces...`);

            await prisma.snippet.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
            await prisma.workItem.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
            await prisma.doc.deleteMany({ where: { workspaceId: { in: workspaceIds } } });

            // Delete workspaces
            await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
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
