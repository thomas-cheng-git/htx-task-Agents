import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { identifySkills } from '../lib/gemini';

const router = Router();

// Recursive include shape — 4 levels deep
const childShape: Record<string, unknown> = {
  skills: { include: { skill: true } },
  assignedDeveloper: { include: { skills: { include: { skill: true } } } },
  childTasks: {
    include: {
      skills: { include: { skill: true } },
      assignedDeveloper: { include: { skills: { include: { skill: true } } } },
      childTasks: {
        include: {
          skills: { include: { skill: true } },
          assignedDeveloper: { include: { skills: { include: { skill: true } } } },
          childTasks: {
            include: {
              skills: { include: { skill: true } },
              assignedDeveloper: { include: { skills: { include: { skill: true } } } },
              childTasks: false,
            },
          },
        },
      },
    },
  },
};

const taskInclude = {
  skills: { include: { skill: true } },
  assignedDeveloper: { include: { skills: { include: { skill: true } } } },
  childTasks: { include: childShape },
};

router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { parentTaskId: null },
      include: taskInclude,
      orderBy: { createdAt: 'asc' },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: Number(req.params.id as string) },
      include: taskInclude,
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

interface TaskInput {
  title: string;
  skillIds?: number[];
  subtasks?: TaskInput[];
}

async function createTaskRecursive(
  input: TaskInput,
  parentTaskId: number | null,
  availableSkills: { id: number; name: string }[]
): Promise<{ id: number }> {
  let skillIds = input.skillIds;

  // If no skills provided, use Gemini to identify them
  if (!skillIds || skillIds.length === 0) {
    skillIds = await identifySkills(input.title, availableSkills);
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      parentTaskId,
      skills: skillIds && skillIds.length > 0
        ? { create: skillIds.map(id => ({ skillId: id })) }
        : undefined,
    },
    select: { id: true },
  });

  if (input.subtasks && input.subtasks.length > 0) {
    for (const subtask of input.subtasks) {
      await createTaskRecursive(subtask, task.id, availableSkills);
    }
  }

  return task;
}

router.post('/', async (req, res) => {
  try {
    const { title, skillIds, subtasks } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const availableSkills = await prisma.skill.findMany();

    const task = await prisma.$transaction(async () => {
      return createTaskRecursive({ title, skillIds, subtasks }, null, availableSkills);
    });

    // Return the full task with all relations
    const fullTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: taskInclude,
    });

    res.status(201).json(fullTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const taskId = Number(req.params.id as string);
    const { assignedDeveloperId, status } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        skills: true,
        childTasks: true,
      },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Validate skill match if assigning developer
    if (assignedDeveloperId !== undefined && assignedDeveloperId !== null) {
      const taskSkillIds = task.skills.map(s => s.skillId);

      if (taskSkillIds.length > 0) {
        const developer = await prisma.developer.findUnique({
          where: { id: assignedDeveloperId },
          include: { skills: true },
        });

        if (!developer) return res.status(404).json({ error: 'Developer not found' });

        const devSkillIds = developer.skills.map(s => s.skillId);
        const hasAllSkills = taskSkillIds.every(id => devSkillIds.includes(id));

        if (!hasAllSkills) {
          return res.status(400).json({
            error: 'Developer does not have the required skills for this task',
          });
        }
      }
    }

    // Validate subtasks are done before marking task as Done
    if (status === 'Done') {
      const pendingSubtasks = task.childTasks.filter(t => t.status !== 'Done');
      if (pendingSubtasks.length > 0) {
        return res.status(400).json({
          error: 'All subtasks must be Done before marking this task as Done',
        });
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(assignedDeveloperId !== undefined && { assignedDeveloperId }),
        ...(status !== undefined && { status }),
      },
      include: taskInclude,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

export default router;
