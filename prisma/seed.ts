import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Nexus-AI database...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nexus.ai' },
    update: {},
    create: {
      email: 'admin@nexus.ai',
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'nexus-core' },
    update: {},
    create: {
      name: 'Nexus Core Workspace',
      slug: 'nexus-core',
      description: 'Default organization workspace for Nexus-AI',
      members: {
        create: {
          userId: adminUser.id,
          role: 'OWNER',
        },
      },
    },
  });

  await prisma.prompt.create({
    data: {
      title: 'Code Refactoring Assistant',
      content: 'Refactor the following function for maximum clarity and performance in TypeScript:',
      tags: ['coding', 'typescript', 'refactoring'],
      isPublic: true,
      authorId: adminUser.id,
      workspaceId: workspace.id,
    },
  });

  console.log('Seeding complete for Nexus-AI.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
