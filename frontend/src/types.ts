export interface Skill {
  id: number;
  name: string;
}

export interface DeveloperSkill {
  skillId: number;
  developerId: number;
  skill: Skill;
}

export interface Developer {
  id: number;
  name: string;
  skills: DeveloperSkill[];
}

export interface TaskSkill {
  skillId: number;
  taskId: number;
  skill: Skill;
}

export interface Task {
  id: number;
  title: string;
  status: string;
  assignedDeveloperId: number | null;
  parentTaskId: number | null;
  createdAt: string;
  assignedDeveloper: Developer | null;
  skills: TaskSkill[];
  childTasks: Task[];
}
