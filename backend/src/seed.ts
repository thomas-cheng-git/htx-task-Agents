import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const devCount = await prisma.developer.count();
  if (devCount > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }

  // Create skills
  const frontend = await prisma.skill.upsert({
    where: { name: 'Frontend' },
    update: {},
    create: { name: 'Frontend' },
  });
  const backend = await prisma.skill.upsert({
    where: { name: 'Backend' },
    update: {},
    create: { name: 'Backend' },
  });

  // Create developers
  const alice = await prisma.developer.create({ data: { name: 'Alice' } });
  const bob = await prisma.developer.create({ data: { name: 'Bob' } });
  const carol = await prisma.developer.create({ data: { name: 'Carol' } });
  const dave = await prisma.developer.create({ data: { name: 'Dave' } });

  // Assign skills
  await prisma.developerSkill.createMany({
    data: [
      { developerId: alice.id, skillId: frontend.id },
      { developerId: bob.id, skillId: backend.id },
      { developerId: carol.id, skillId: frontend.id },
      { developerId: carol.id, skillId: backend.id },
      { developerId: dave.id, skillId: backend.id },
    ],
  });

  // Create sample tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Build login page',
      skills: { create: [{ skillId: frontend.id }] },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Design REST API',
      skills: { create: [{ skillId: backend.id }] },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Full-stack dashboard',
      skills: { create: [{ skillId: frontend.id }, { skillId: backend.id }] },
    },
  });

  console.log('Seeded:', { alice, bob, carol, dave, frontend, backend, task1, task2, task3 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
