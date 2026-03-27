import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({ orderBy: { id: 'asc' } });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const skill = await prisma.skill.findUnique({
      where: { id: Number(req.params.id as string) },
    });
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

export default router;
