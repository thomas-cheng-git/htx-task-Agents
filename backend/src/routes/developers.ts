import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { skillIds } = req.query;

    if (skillIds && typeof skillIds === 'string') {
      const ids = skillIds.split(',').map(Number).filter(Boolean);

      if (ids.length > 0) {
        // Find developers who have ALL specified skills
        const developers = await prisma.developer.findMany({
          where: {
            skills: {
              some: {
                skillId: { in: ids },
              },
            },
          },
          include: {
            skills: { include: { skill: true } },
          },
        });

        // Filter: must have ALL specified skills (not just some)
        const filtered = developers.filter(dev => {
          const devSkillIds = dev.skills.map(s => s.skillId);
          return ids.every(id => devSkillIds.includes(id));
        });

        return res.json(filtered);
      }
    }

    const developers = await prisma.developer.findMany({
      include: { skills: { include: { skill: true } } },
      orderBy: { id: 'asc' },
    });
    res.json(developers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch developers' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const developer = await prisma.developer.findUnique({
      where: { id: Number(req.params.id as string) },
      include: { skills: { include: { skill: true } } },
    });
    if (!developer) return res.status(404).json({ error: 'Developer not found' });
    res.json(developer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch developer' });
  }
});

export default router;
