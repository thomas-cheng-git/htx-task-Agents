import { useEffect, useState } from 'react';
import type { Task, Developer } from '../types';
import { getTasks, updateTask } from '../api/tasks';
import { getDevelopers } from '../api/developers';
import SkillBadge from '../components/SkillBadge';

const STATUS_OPTIONS = ['To-do', 'In Progress', 'Done'];

const STATUS_DOT: Record<string, string> = {
  'To-do': 'bg-slate-500',
  'In Progress': 'bg-yellow-400',
  'Done': 'bg-green-400',
};

const STATUS_TEXT: Record<string, string> = {
  'To-do': 'text-slate-400',
  'In Progress': 'text-yellow-400',
  'Done': 'text-green-400',
};

interface TaskRowProps {
  task: Task;
  depth: number;
  onUpdate: () => void;
}

function TaskRow({ task, depth, onUpdate }: TaskRowProps) {
  const [error, setError] = useState('');
  const [eligibleDevs, setEligibleDevs] = useState<Developer[]>([]);

  useEffect(() => {
    const skillIds = task.skills.map(s => s.skillId);
    getDevelopers(skillIds.length > 0 ? skillIds : undefined).then(setEligibleDevs);
  }, [task.skills]);

  const handleStatusChange = async (status: string) => {
    setError('');
    try {
      await updateTask(task.id, { status });
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleAssigneeChange = async (devId: string) => {
    setError('');
    try {
      await updateTask(task.id, {
        assignedDeveloperId: devId === '' ? null : Number(devId),
      });
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update assignee');
    }
  };

  return (
    <>
      <tr className="border-b border-[#2d3148] hover:bg-[#1e2130] transition-colors">
        <td className={`py-3 px-4 ${depth > 0 ? 'border-l-2 border-indigo-500/40' : ''}`}>
          <div style={{ paddingLeft: `${depth * 20}px` }} className="flex items-center gap-2">
            <span className="text-[#e2e8f0] text-sm">{task.title}</span>
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-1.5 flex-wrap">
            {task.skills.map(ts => (
              <SkillBadge key={ts.skillId} name={ts.skill.name} />
            ))}
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[task.status] ?? 'bg-slate-500'}`} />
            <select
              value={task.status}
              onChange={e => handleStatusChange(e.target.value)}
              className={`bg-[#0f1117] border border-[#2d3148] text-sm rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-colors cursor-pointer ${STATUS_TEXT[task.status] ?? 'text-[#e2e8f0]'}`}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </td>
        <td className="py-3 px-4">
          <select
            value={task.assignedDeveloperId ?? ''}
            onChange={e => handleAssigneeChange(e.target.value)}
            className="bg-[#0f1117] border border-[#2d3148] text-[#e2e8f0] text-sm rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-colors cursor-pointer"
          >
            <option value="">Unassigned</option>
            {eligibleDevs.map(dev => (
              <option key={dev.id} value={dev.id}>{dev.name}</option>
            ))}
          </select>
        </td>
      </tr>
      {error && (
        <tr className="border-b border-[#2d3148]">
          <td colSpan={4} className="py-1 px-4">
            <p className="text-red-400 text-xs">{error}</p>
          </td>
        </tr>
      )}
      {task.childTasks.map(child => (
        <TaskRow key={child.id} task={child} depth={depth + 1} onUpdate={onUpdate} />
      ))}
    </>
  );
}

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-slate-400 text-sm">Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#e2e8f0] mb-6">Tasks</h1>
      <div className="bg-[#13151f] border border-[#2d3148] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#2d3148] bg-[#0f1117]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Skills</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  No tasks yet. <a href="/create" className="text-indigo-400 hover:text-indigo-300">Create one</a>.
                </td>
              </tr>
            ) : (
              tasks.map(task => (
                <TaskRow key={task.id} task={task} depth={0} onUpdate={loadTasks} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
